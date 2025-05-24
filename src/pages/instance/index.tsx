import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useLiveData } from "../../contexts/LiveDataContext";
import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { NodeBasicInfo } from "../../types/NodeBasicInfo";
import type { Record } from "../../types/LiveData";
import Flag from "../../components/Flag";
import { Flex, Text } from "@radix-ui/themes";
import { formatBytes, formatUptime } from "../../components/Node";

export default function InstancePage() {
  const { t } = useTranslation();
  const { live_data, onRefresh } = useLiveData();
  const { uuid } = useParams<{ uuid: string }>();
  const [recent, setRecent] = useState<Record[]>([]);
  const [node, setNode] = useState<NodeBasicInfo | null>(null);
  const length = 180;
  // 初始数据加载
  useEffect(() => {
    fetch("/api/nodes")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          const nodes = data.data;
          if (Array.isArray(nodes)) {
            const current = nodes.find((n: NodeBasicInfo) => n.uuid === uuid);
            setNode(current || null);
            document.title = `${t("instance")}: ${current?.name || uuid}`;
          }
        }
      })
      .catch((err) => console.error("Failed to fetch nodes:", err));
    fetch(`/api/recent/${uuid}`)
      .then((res) => res.json())
      .then((data) => setRecent(data.slice(-length)))
      .catch((err) => console.error("Failed to fetch recent data:", err));
  }, [uuid]);

  // 动态追加数据
  useEffect(() => {
    const unsubscribe = onRefresh((resp) => {
      if (!uuid) return;
      const data = resp.data.data[uuid];
      if (!data) return;

      setRecent((prev) => {
        const newRecord: Record = data;
        // 追加新数据，限制总长度为length（FIFO）
        // 检查是否已存在相同时间戳的记录
        const exists = prev.some(
          (item) => item.updated_at === newRecord.updated_at
        );
        if (exists) {
          return prev; // 如果已存在，不添加新记录
        }

        // 否则，追加新记录
        const updated = [...prev, newRecord].slice(-length);
        return updated;
      });
    });

    // 清理订阅
    return unsubscribe;
  }, [onRefresh, uuid]);

  return (
    <Flex direction={"column"} gap="2">
      <div className="flex flex-col gap-2 p-4 bg-accent-2 rounded-lg">
        <h1 className="flex items-center flex-wrap">
          <Flag flag={node?.region ?? ""} />
          <Text size="3" weight="bold" wrap="nowrap">
            {node?.name ?? uuid}
          </Text>
          <Text
            size="1"
            style={{
              marginLeft: "8px",
            }}
            className="text-accent-6"
            wrap="nowrap"
          >
            {node?.uuid}
          </Text>
        </h1>

        <label className="flex flex-wrap gap-2">
          <Flex align={"center"} gap="2">
            <Text size="2" weight="bold" wrap="nowrap">
              CPU
            </Text>
            <Text size="2">
              {node?.cpu_name} (x{node?.cpu_cores})
            </Text>
          </Flex>
          <Flex align={"center"} gap="2">
            <Text size="2" weight="bold" wrap="nowrap">
              {t("nodeCard.arch")}
            </Text>
            <Text size="2">{node?.arch}</Text>
          </Flex>
        </label>
        <label className="flex flex-wrap gap-2">
          <Flex align={"center"} gap="2">
            <Text size="2" weight="bold" wrap="nowrap">
              {t("nodeCard.os")}
            </Text>
            <Text size="2">{node?.os}</Text>
          </Flex>
          <Flex align={"center"} gap="2">
            <Text size="2" weight="bold" wrap="nowrap">
              {t("nodeCard.uptime")}
            </Text>
            <Text size="2">
              {formatUptime(live_data?.data.data[uuid ?? ""]?.uptime || 0, t)}
            </Text>
          </Flex>
        </label>
        <label className="flex flex-wrap gap-2">
          <Flex align={"center"} gap="2">
            <Text size="2" weight="bold" wrap="nowrap">
              {t("nodeCard.networkSpeed")}
            </Text>
            <Text size="2">
              ↑ {formatBytes(live_data?.data.data[uuid ?? ""]?.network.up || 0)}{" "}
              ↓{" "}
              {formatBytes(live_data?.data.data[uuid ?? ""]?.network.down || 0)}
            </Text>
          </Flex>
          <Flex align={"center"} gap="2">
            <Text size="2" weight="bold" wrap="nowrap">
              {t("nodeCard.totalTraffic")}
            </Text>
            <Text size="2">
              ↑{" "}
              {formatBytes(
                live_data?.data.data[uuid ?? ""]?.network.totalUp || 0
              )}{" "}
              ↓{" "}
              {formatBytes(
                live_data?.data.data[uuid ?? ""]?.network.totalDown || 0
              )}
            </Text>
          </Flex>
        </label>
        <label className="flex flex-wrap gap-2">
          <Flex align={"center"} gap="2">
            <Text size="2" weight="bold" wrap="nowrap">
              {t("nodeCard.ram")}
            </Text>
            <Text size="2">{formatBytes(node?.mem_total || 0)}</Text>
          </Flex>
          <Flex align={"center"} gap="2">
            <Text size="2" weight="bold" wrap="nowrap">
              {t("nodeCard.swap")}
            </Text>
            <Text size="2">{formatBytes(node?.swap_total || 0)}</Text>
          </Flex>
        </label>
        <label className="flex flex-wrap gap-2">
          <Flex align={"center"} gap="2">
            <Text size="2" weight="bold" wrap="nowrap">
              {t("nodeCard.disk")}
            </Text>
            <Text size="2">{formatBytes(node?.disk_total || 0)}</Text>
          </Flex>
        </label>
        <label className="flex flex-wrap gap-2">
          <Flex align={"center"} gap="2">
            <Text size="2" weight="bold" wrap="nowrap">
              {t("nodeCard.last_updated")}
            </Text>
            <Text size="2">
              {node?.UpdatedAt
                ? new Date(
                    live_data?.data.data[uuid ?? ""]?.updated_at ||
                      node.UpdatedAt
                  ).toLocaleString()
                : "-"}
            </Text>
          </Flex>
        </label>
      </div>

      {/* Recharts */}
      <div className="grid w-full items-center justify-center mx-auto h-full gap-4 p-1 md:grid-cols-[repeat(auto-fit,minmax(620px,1fr))] grid-cols-[repeat(auto-fit,minmax(320px,1fr))]">
        <SingleLineChart
          data={recent}
          dataKey="cpu.usage"
          name={t("chart.cpu_usage")}
          max={100}
          min={0}
          percentage={true}
        />

        {/* 内存/交换分区使用情况 */}
        <div className="w-auto bg-accent-2 rounded-lg p-4 ">
          <div className="flex flex-col justify-center items-center h-64 w-full">
            <h3 className="text-lg font-semibold">{t("chart.mem_used")}</h3>
            <ResponsiveContainer>
              <LineChart
                data={recent.map((record) => ({
                  ...record,
                  ramPercent: node?.mem_total
                    ? (record.ram?.used / node.mem_total) * 100
                    : 0,
                  swapPercent: node?.swap_total
                    ? (record.swap?.used / node.swap_total) * 100
                    : 0,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--accent-4)" />
                <XAxis
                  tick={{ fontSize: "0.7rem" }}
                  dataKey="updated_at"
                  tickFormatter={(isoString) =>
                    new Date(isoString).toLocaleTimeString([], {
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  }
                  stroke="var(--accent-12)"
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => {
                    return `${value.toFixed(0)}%`;
                  }}
                  stroke="var(--accent-12)"
                  fontSize={"0.8rem"}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--accent-4)",
                    borderColor: "var(--accent-7)",
                    borderRadius: 8,
                  }}
                  formatter={(value: number, name: string, props: any) => {
                    // 根据数据类型返回不同的格式
                    if (name === t("chart.mem_used")) {
                      return [
                        `${formatBytes(
                          props.payload.ram?.used || 0
                        )} (${value.toFixed(1)}%)`,
                        name,
                      ];
                    } else if (name === t("chart.swap_used")) {
                      return [
                        `${formatBytes(
                          props.payload.swap?.used || 0
                        )} (${value.toFixed(1)}%)`,
                        name,
                      ];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(label) =>
                    new Date(label).toLocaleString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  }
                />
                <Line
                  name={t("chart.mem_used")}
                  isAnimationActive={false}
                  animationEasing="ease-in"
                  animationDuration={500}
                  type="monotone"
                  dataKey={"ramPercent"}
                  stroke="var(--accent-8)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line
                  name={t("chart.swap_used")}
                  isAnimationActive={false}
                  animationEasing="ease-in"
                  animationDuration={500}
                  type="monotone"
                  dataKey={"swapPercent"}
                  stroke="var(--accent-10)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/** Network */}
        <DoubleLineChart
          data={recent}
          dataKey1="network.up"
          dataKey2="network.down"
          title={t("nodeCard.networkSpeed")}
          name1={t("chart.network_up")}
          name2={t("chart.network_down")}
          max={0}
          min={0}
          percentage={false}
          bytes={true}
        />
        <DoubleLineChart
          data={recent}
          dataKey1="connections.tcp"
          dataKey2="connections.udp"
          title={t("chart.connections")}
          name1={t("chart.tcp_connections")}
          name2={t("chart.udp_connections")}
          max={0}
          min={0}
          percentage={false}
        />
        <SingleLineChart
          data={recent}
          dataKey="disk.used"
          name={t("chart.disk_used")}
          max={node?.disk_total || 0}
          min={0}
          percentage={false}
          bytes={true}
        />
        <SingleLineChart
          data={recent}
          dataKey="process"
          name={t("chart.process")}
          max={0}
          min={0}
          percentage={false}
        />
      </div>
    </Flex>
  );
}

type SingleLineChartProps = {
  data: Record[];
  dataKey: string;
  name: string;
  max?: number;
  min?: number;
  percentage?: boolean;
  bytes?: boolean;
};
const SingleLineChart = ({
  data,
  dataKey,
  name,
  max,
  min,
  percentage,
  bytes,
}: SingleLineChartProps) => {
  return (
    <div className="w-auto bg-accent-2 rounded-lg p-4 ">
      <div className="flex flex-col justify-center items-center h-64 w-full">
        <h3 className="text-lg font-semibold">{name}</h3>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--accent-4)" />
            <XAxis
              tick={{ fontSize: "0.7rem" }}
              dataKey="updated_at"
              tickFormatter={(isoString) =>
                new Date(isoString).toLocaleTimeString([], {
                  minute: "2-digit",
                  second: "2-digit",
                })
              }
              stroke="var(--accent-12)"
            />
            <YAxis
              domain={[min || 0, max || 100]}
              tickFormatter={(value) =>
                bytes
                  ? formatBytes(value)
                  : `${percentage ? value.toFixed(0) + "%" : value}`
              }
              stroke="var(--accent-12)"
              fontSize={bytes ? "0.8rem" : "1rem"}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--accent-4)",
                borderColor: "var(--accent-7)",
                borderRadius: 8,
              }}
              formatter={(value: number) =>
                bytes
                  ? formatBytes(value)
                  : percentage
                  ? `${value.toFixed(0)}%`
                  : value
              }
              labelFormatter={(label) =>
                new Date(label).toLocaleString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              }
            />
            <Line
              name={name}
              isAnimationActive={false}
              animationEasing="ease-in"
              animationDuration={500}
              type="monotone"
              dataKey={dataKey}
              stroke="var(--accent-8)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

type DoubleLineChartProps = {
  data: Record[];
  dataKey1: string;
  dataKey2: string;
  title?: string;
  name1: string;
  name2: string;
  max?: number;
  min?: number;
  percentage?: boolean;
  bytes?: boolean;
};

const DoubleLineChart = ({
  data,
  dataKey1,
  dataKey2,
  title,
  name1,
  name2,
  max,
  min,
  percentage,
  bytes,
}: DoubleLineChartProps) => {
  return (
    <div className="w-auto bg-accent-2 rounded-lg p-4">
      <div className="flex flex-col justify-center items-center h-64 w-full">
        <h3 className="text-lg font-semibold">{title}</h3>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--accent-4)" />
            <XAxis
              tick={{ fontSize: "0.7rem" }}
              dataKey="updated_at"
              tickFormatter={(isoString) =>
                new Date(isoString).toLocaleTimeString([], {
                  minute: "2-digit",
                  second: "2-digit",
                })
              }
              stroke="var(--accent-12)"
            />
            <YAxis
              domain={[min || 0, max || 100]}
              tickFormatter={(value) => {
                if (bytes) {
                  return formatBytes(value);
                }
                return percentage ? `${value.toFixed(0)}%` : value;
              }}
              stroke="var(--accent-12)"
              fontSize={bytes ? "0.8rem" : "1rem"}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--accent-4)",
                borderColor: "var(--accent-7)",
                borderRadius: 8,
              }}
              formatter={(value: number) => {
                if (bytes) {
                  return formatBytes(value);
                }
                return percentage ? `${value.toFixed(0)}%` : value;
              }}
              labelFormatter={(label) =>
                new Date(label).toLocaleString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              }
            />
            <Line
              name={name1}
              isAnimationActive={false}
              animationEasing="ease-in"
              animationDuration={500}
              type="monotone"
              dataKey={dataKey1}
              stroke="var(--accent-8)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line
              name={name2}
              isAnimationActive={false}
              animationEasing="ease-in"
              animationDuration={500}
              type="monotone"
              dataKey={dataKey2}
              stroke="var(--accent-10)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
