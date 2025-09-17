import type { Record } from "@/types/LiveData";

export interface RecordFormat {
  client: string;
  time: string;
  cpu: number | null;
  gpu: number | null;
  gpu_usage: number | null;
  gpu_memory: number | null;
  gpu_detailed?: {
    [index: number]: {
      usage: number | null;
      memory: number | null;
      temperature: number | null;
      device_index?: number;
      device_name?: string;
      mem_total?: number;
      mem_used?: number;
    };
  };
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

export function liveDataToRecords(
  client: string,
  liveData: Record[]
): RecordFormat[] {
  if (!liveData) return [];
  return liveData.map((data) => ({
    client: client,
    time: data.updated_at || "",
    cpu: data.cpu.usage ?? 0,
    gpu: 0,
    gpu_usage: data.gpu?.average_usage ?? 0,
    gpu_memory: data.gpu ?
      data.gpu.detailed_info?.reduce((acc, gpu) =>
        acc + (gpu.memory_used / gpu.memory_total) * 100, 0) / data.gpu.count || 0
      : 0,
    gpu_detailed: data.gpu?.detailed_info?.reduce((acc, gpu, index) => {
      acc[index] = {
        usage: gpu.utilization ?? null,
        memory: (gpu.memory_used / gpu.memory_total) * 100,
        temperature: gpu.temperature ?? null,
      };
      return acc;
    }, {} as { [index: number]: { usage: number | null; memory: number | null; temperature: number | null; } }) || undefined,
    ram: data.ram.used ?? 0,
    ram_total: 0,
    swap: data.swap.used ?? 0,
    swap_total: 0,
    load: data.load.load1 ?? 0,
    temp: 0,
    disk: data.disk.used ?? 0,
    disk_total: 0,
    net_in: data.network?.down ?? 0,
    net_out: data.network?.up ?? 0,
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
export default function fillMissingTimePoints<
  T extends { time?: string; updated_at?: string }
>(
  data: T[],
  intervalSec: number = 10,
  totalSeconds: number | null = 180,
  matchToleranceSec?: number
): T[] {
  if (!data.length) return [];

  const getTime = (item: T) =>
    new Date(item.time ?? item.updated_at ?? "").getTime();

  // Performance: Pre-calculate timestamps to avoid redundant parsing during sort and search.
  const timedData = data.map((item) => ({ item, timeMs: getTime(item) }));
  timedData.sort((a, b) => a.timeMs - b.timeMs);

  const firstItem = timedData[0];
  const lastItem = timedData[timedData.length - 1];
  const end = lastItem.timeMs;
  const interval = intervalSec * 1000;

  // NEW: Determine the start time based on whether totalSeconds is set for a fixed length.
  const start =
    totalSeconds !== null && totalSeconds > 0
      ? end - totalSeconds * 1000 + interval // Fixed-length mode
      : firstItem.timeMs; // Variable-length mode: start from the first data point

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

/**
 * EWMA（指数加权移动平均）
 * 使用指数加权移动平均算法平滑数据，同时检测并过滤突变值，填充 null/undefined 值
 *
 * @param data 输入数据数组，每个元素应该包含数值型属性
 * @param keys 需要处理的数值属性名数组
 * @param alpha 平滑因子
 * @param windowSize 突变检测窗口大小
 * @param spikeThreshold 突变阈值
 * @returns 处理后的数据数组
 */
export function cutPeakValues<T extends { [key: string]: any }>(
  data: T[],
  keys: string[],
  alpha: number = 0.3,
  windowSize: number = 15,
  spikeThreshold: number = 0.3
): T[] {
  if (!data || data.length === 0) return data;

  const result = [...data];
  const halfWindow = Math.floor(windowSize / 2);

  // 为每个需要处理的键执行突变检测和EWMA平滑
  for (const key of keys) {
    // 第一步：检测并移除突变值
    for (let i = 0; i < result.length; i++) {
      const currentValue = result[i][key];

      // 如果当前值是有效数值，检查是否为突变
      if (currentValue != null && typeof currentValue === "number") {
        const neighborValues: number[] = [];
        
        // 收集窗口范围内的邻近有效值
        for (
          let j = Math.max(0, i - halfWindow);
          j <= Math.min(result.length - 1, i + halfWindow);
          j++
        ) {
          if (j === i) continue; // 跳过当前值
          const neighbor = result[j][key];
          if (neighbor != null && typeof neighbor === "number") {
            neighborValues.push(neighbor);
          }
        }

        // 如果有足够的邻近值进行突变检测
        if (neighborValues.length >= 2) {
          const neighborSum = neighborValues.reduce((sum, val) => sum + val, 0);
          const neighborMean = neighborValues.length > 0 ? neighborSum / neighborValues.length : 0;

          // 检测突变：如果当前值与邻近值平均值的相对差异超过阈值
          if (neighborMean > 0) {
            const relativeChange = Math.abs(currentValue - neighborMean) / neighborMean;
            if (relativeChange > spikeThreshold) {
              // 标记为突变，设置为null，稍后用EWMA填充
              result[i] = { ...result[i], [key]: null };
            }
          } else if (Math.abs(currentValue) > 10) {
            // 如果邻近值平均值接近0，但当前值很大，也视为突变
            result[i] = { ...result[i], [key]: null };
          }
        }
      }
    }

    // 第二步：使用EWMA平滑和填充
    let ewma: number | null = null;

    for (let i = 0; i < result.length; i++) {
      const currentValue = result[i][key];

      // 如果当前值是有效数值
      if (currentValue != null && typeof currentValue === "number") {
        if (ewma === null) {
          // 第一个有效值作为初始EWMA值
          ewma = currentValue;
        } else {
          // EWMA = α * 当前值 + (1-α) * 前一个EWMA值
          ewma = alpha * currentValue + (1 - alpha) * ewma;
        }
        result[i] = { ...result[i], [key]: ewma };
      } else if (ewma !== null) {
        // 如果当前值无效但已有EWMA值，用EWMA值填充
        result[i] = { ...result[i], [key]: ewma };
      }
      // 如果当前值无效且还没有EWMA值，保持原值（null/undefined）
    }
  }

  return result;
}

/**
 * @deprecated 使用服务端传递的 loss 字段
 * 计算丢包率
 * 根据图表数据计算丢包率，null或undefined的数据视为丢包
 * @param chartData 图表数据数组（包含填充的null值）
 * @param taskId 任务ID
 * @returns 丢包率百分比，保留1位小数
 */
export function calculateLossRate(chartData: any[], taskId: number): number {
  if (!chartData || chartData.length === 0) return 0;

  const totalCount = chartData.length;
  const lostCount = chartData.filter(
    (dataPoint) => dataPoint[taskId] === null || dataPoint[taskId] === undefined
  ).length;

  const lossRate = (lostCount / totalCount) * 100;
  return Math.round(lossRate * 10) / 10; // 保留1位小数
}
