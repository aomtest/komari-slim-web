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