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
 * 智能削峰函数：基于局部邻近值判断异常峰值
 * 如果一个数值相比其前后的邻近值有显著跳跃，则将其替换为邻近值的平均值
 * 同时填充 null/undefined 值
 *
 * @param data 输入数据数组，每个元素应该包含数值型属性
 * @param keys 需要处理的数值属性名数组
 * @param windowSize 判断窗口大小，默认为5（检查前后各2个值）
 * @param threshold 异常阈值倍数，默认为1.2（超过邻近值平均值的1.2倍视为异常）
 * @returns 处理后的数据数组
 */
export function cutPeakValues<T extends { [key: string]: any }>(
  data: T[],
  keys: string[],
  windowSize: number = 5,
  threshold: number = 1.1
): T[] {
  if (!data || data.length < 3) return data; // 至少需要3个点才能进行有意义的比较

  const result = [...data];
  const halfWindow = Math.floor(windowSize / 2);

  // 为每个需要处理的键执行削峰和填充
  for (const key of keys) {
    // 第一步：填充 null/undefined 值
    for (let i = 0; i < result.length; i++) {
      const currentValue = result[i][key];

      // 如果当前值是 null/undefined，用邻近值替代
      if (currentValue == null || typeof currentValue !== "number") {
        const neighborValues: number[] = [];

        // 收集邻近的有效值
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

        // 如果有邻近值，用平均值替代
        if (neighborValues.length > 0) {
          const neighborSum = neighborValues.reduce((sum, val) => sum + val, 0);
          const neighborMean = neighborSum / neighborValues.length;
          result[i] = { ...result[i], [key]: neighborMean };
        }
      }
    }

    // 第二步：削峰处理 (现在会处理包括端点在内的所有值)
    for (let i = 0; i < result.length; i++) {
      const currentValue = result[i][key];

      // 现在所有值都应该是有效的数值
      if (currentValue == null || typeof currentValue !== "number") continue;

      // 收集邻近的有效值
      const neighborValues: number[] = [];
      const start = Math.max(0, i - halfWindow);
      const end = Math.min(result.length - 1, i + halfWindow);

      for (let j = start; j <= end; j++) {
        if (j === i) continue; // 跳过当前值
        const neighbor = result[j][key];
        if (neighbor != null && typeof neighbor === "number") {
          neighborValues.push(neighbor);
        }
      }

      // 如果邻近值太少，跳过处理
      if (neighborValues.length < 2) continue;

      // 计算邻近值的统计信息
      const neighborSum = neighborValues.reduce((sum, val) => sum + val, 0);
      const neighborMean = neighborSum / neighborValues.length;

      // 如果邻近值平均值接近0，使用不同的判断逻辑
      if (neighborMean < 1) {
        // 对于很小的邻近值，如果当前值超过50ms，视为异常
        // if (currentValue > 50) {
        //   result[i] = { ...result[i], [key]: neighborMean };
        // }
      } else {
        // 正常情况：如果当前值超过邻近值平均值的threshold倍，视为异常
        if (currentValue > neighborMean * threshold) {
          result[i] = { ...result[i], [key]: neighborMean };
        }
      }
    }
  }

  return result;
}

/**
 * 计算丢包率
 * 根据图表数据计算丢包率，null或undefined的数据视为丢包
 *
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
