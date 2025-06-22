import type { Record } from "@/types/LiveData";


export interface RecordFormat {
  client: string;
  time: string;
  cpu: number;
  gpu: number;
  ram: number;
  ram_total: number;
  swap: number;
  swap_total: number;
  load: number;
  temp: number;
  disk: number;
  disk_total: number;
  net_in: number;
  net_out: number;
  net_total_up: number;
  net_total_down: number;
  process: number;
  connections: number;
  connections_udp: number;
}

export function liveDataToRecords(client: string, liveData: Record[]): RecordFormat[] {
  if (!liveData) return [];
  return liveData.map((data) => ({
    client: client,
    time: data.updated_at || "",
    cpu: data.cpu.usage ?? 0,
    gpu: 0,
    ram: data.ram.used ?? 0,
    ram_total:  0,
    swap: data.swap.used ?? 0,
    swap_total: 0,
    load: data.load.load1 ?? 0,
    temp: 0,
    disk: data.disk.used ?? 0,
    disk_total: 0,
    net_in: data.network?.up ?? 0,
    net_out: data.network?.down ?? 0,
    net_total_up: data.network?.totalUp ?? 0,
    net_total_down: data.network?.totalDown ?? 0,
    process: data.process ?? 0,
    connections: data.connections.tcp ?? 0,
    connections_udp: data.connections.udp ?? 0,
  }));
}

export default function fillMissingTimePoints<T extends { time?: string; updated_at?: string }>(
  data: T[],
  intervalSec: number = 10,
  totalSeconds: number = 180,
  matchToleranceSec?: number
): T[] {
  if (!data.length) return [];
  // 按时间升序排序
  const getTime = (item: T) => new Date(item.time ?? item.updated_at ?? "").getTime();
  const sorted = [...data].sort((a, b) => getTime(a) - getTime(b));
  const end = getTime(sorted[sorted.length - 1]);
  const interval = intervalSec * 1000;
  const start = end - totalSeconds * 1000 + interval;
  const timePoints: number[] = [];
  for (let t = start; t <= end; t += interval) {
    timePoints.push(t);
  }
  const zeroTemplate = deepZeroFill(sorted[sorted.length - 1]);
  let dataIdx = 0;
  const matchToleranceMs = (matchToleranceSec ?? intervalSec) * 1000;
  const filled: T[] = timePoints.map((t) => {
    let found: T | undefined = undefined;
    while (
      dataIdx < sorted.length &&
      getTime(sorted[dataIdx]) < t - matchToleranceMs
    ) {
      dataIdx++;
    }
    if (
      dataIdx < sorted.length &&
      Math.abs(getTime(sorted[dataIdx]) - t) <= matchToleranceMs
    ) {
      found = sorted[dataIdx];
    }
    if (found) {
      return { ...found, time: new Date(t).toISOString() };
    }
    return { ...zeroTemplate, time: new Date(t).toISOString() } as T;
  });
  return filled;
}

// 递归补0工具
function deepZeroFill(obj: any): any {
  if (obj === null || obj === undefined) return 0;
  if (typeof obj === "number") return 0;
  if (typeof obj === "string" || typeof obj === "boolean") return obj;
  if (Array.isArray(obj)) return obj.map(deepZeroFill);
  if (typeof obj === "object") {
    const res: any = {};
    for (const k in obj) {
      if (k === "updated_at" || k === "time") continue;
      res[k] = deepZeroFill(obj[k]);
    }
    return res;
  }
  return 0;
}