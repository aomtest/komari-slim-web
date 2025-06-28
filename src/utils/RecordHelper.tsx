import type { Record } from "@/types/LiveData";

export interface RecordFormat {
  client: string;
  time: string;
  cpu: number | null;
  gpu: number | null;
  ram: number | null;
  ram_total: number | null;
  swap: number | null;
  swap_total: number | null;
  load: number | null;
  temp: number | null;
  disk: number | null;
  disk_total: number | null;
  net_in: number | null;
  net_out: number | null;
  net_total_up: number | null;
  net_total_down: number | null;
  process: number | null;
  connections: number | null;
  connections_udp: number | null;
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

/**
 * Creates a template object by recursively setting all numeric properties to null.
 * This is used to create placeholder items for missing time points.
 * @param obj The object to use as a template.
 * @returns A new object with the same structure, but with null for all numeric values.
 */
function createNullTemplate(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj === "number") return null;
  if (typeof obj === "string" || typeof obj === "boolean") return obj;
  if (Array.isArray(obj)) return obj.map(createNullTemplate);
  if (typeof obj === "object") {
    const res: any = {};
    for (const k in obj) {
      if (k === "updated_at" || k === "time") continue;
      res[k] = createNullTemplate(obj[k]);
    }
    return res;
  }
  return null;
}

/**
 * Fills in missing time points in a dataset. Operates in two modes:
 * 1. Fixed-Length (default): Generates a dataset of a specific duration (`totalSeconds`) ending at the last data point.
 * 2. Variable-Length: If `totalSeconds` is set to `null`, it fills gaps between the first and last data points without enforcing a total duration.
 *
 * @param data The input data array, should have `time` or `updated_at` properties.
 * @param intervalSec The interval in seconds between each time point.
 * @param totalSeconds The total duration of the data to display in seconds. Set to `null` to fill from the first to the last data point instead.
 * @param matchToleranceSec The tolerance in seconds for matching a data point to a time point. Defaults to `intervalSec`.
 * @returns A new array with missing time points filled with null values.
 */
export default function fillMissingTimePoints<T extends { time?: string; updated_at?: string }>(
  data: T[],
  intervalSec: number = 10,
  totalSeconds: number | null = 180,
  matchToleranceSec?: number
): T[] {
  if (!data.length) return [];

  const getTime = (item: T) => new Date(item.time ?? item.updated_at ?? "").getTime();

  // Performance: Pre-calculate timestamps to avoid redundant parsing during sort and search.
  const timedData = data.map(item => ({ item, timeMs: getTime(item) }));
  timedData.sort((a, b) => a.timeMs - b.timeMs);

  const firstItem = timedData[0];
  const lastItem = timedData[timedData.length - 1];
  const end = lastItem.timeMs;
  const interval = intervalSec * 1000;

  // NEW: Determine the start time based on whether totalSeconds is set for a fixed length.
  const start = (totalSeconds !== null && totalSeconds > 0)
      ? end - totalSeconds * 1000 + interval // Fixed-length mode
      : firstItem.timeMs;                      // Variable-length mode: start from the first data point

  // Generate the ideal time points for the chart's x-axis.
  const timePoints: number[] = [];
  for (let t = start; t <= end; t += interval) {
    timePoints.push(t);
  }

  // Create a template with null values for missing data points.
  const nullTemplate = createNullTemplate(lastItem.item);
  
  let dataIdx = 0;
  const matchToleranceMs = (matchToleranceSec ?? intervalSec) * 1000;

  const filled: T[] = timePoints.map((t) => {
    let found: T | undefined = undefined;

    // Advance the data pointer past points that are too old for the current time point.
    while (
      dataIdx < timedData.length &&
      timedData[dataIdx].timeMs < t - matchToleranceMs
    ) {
      dataIdx++;
    }

    // Check if the current data point is within the tolerance window of the ideal time point.
    if (
      dataIdx < timedData.length &&
      Math.abs(timedData[dataIdx].timeMs - t) <= matchToleranceMs
    ) {
      found = timedData[dataIdx].item;
    }

    if (found) {
      // If a point is found, use it, but align its time to the grid.
      return { ...found, time: new Date(t).toISOString() };
    }
    
    // If no point is found, insert the null template.
    return { ...nullTemplate, time: new Date(t).toISOString() } as T;
  });

  return filled;
}