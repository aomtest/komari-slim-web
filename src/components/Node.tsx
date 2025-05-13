import { Card, Flex, Text, Badge, Separator } from "@radix-ui/themes";
import type { LiveData, Record } from "../types/LiveData";
import type { NodeBasicInfo } from "../types/NodeBasicInfo";
import UsageBar from "./UsageBar";
import Flag from "./Flag";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

function formatOs(os: string): string {
  const patterns = [
    { regex: /debian/i, name: "Debian" },
    { regex: /ubuntu/i, name: "Ubuntu" },
    { regex: /windows/i, name: "Windows" },
    { regex: /arch/i, name: "Arch" },
    { regex: /alpine/i, name: "Alpine" },
    { regex: /centos/i, name: "CentOS" },
    { regex: /fedora/i, name: "Fedora" },
    { regex: /red\s*hat/i, name: "RHEL" },
    { regex: /opensuse/i, name: "openSUSE" },
    { regex: /manjaro/i, name: "Manjaro" },
  ];

  for (const pattern of patterns) {
    if (pattern.regex.test(os)) {
      return pattern.name;
    }
  }

  return os.split(/[\s/]/)[0];
}

/** 将字节转换为人类可读的大小 */

/** 格式化秒*/
export function formatUptime(seconds: number): string {
  const [t] = useTranslation();
  if (!seconds || seconds < 0) return "0S";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d) parts.push(`${d} ${t("time_day")}`);
  if (h) parts.push(`${h} ${t("time_hour")}`);
  if (m) parts.push(`${m} ${t("time_minute")}`);
  if (s || parts.length === 0) parts.push(`${s} ${t("time_second")}`);
  return parts.join(" ");
}
export function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

interface NodeProps {
  basic: NodeBasicInfo;
  live: Record | undefined;
  online: boolean;
}
const Node = ({ basic, live, online }: NodeProps) => {
  const [t] = useTranslation();
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const defaultLive = {
    cpu: { usage: 0 },
    ram: { used: 0 },
    disk: { used: 0 },
    network: { up: 0, down: 0, totalUp: 0, totalDown: 0 },
  } as Record;

  const liveData = live || defaultLive;

  const memoryUsagePercent = basic.mem_total
    ? (liveData.ram.used / basic.mem_total) * 100
    : 0;
  const diskUsagePercent = basic.disk_total
    ? (liveData.disk.used / basic.disk_total) * 100
    : 0;

  const uploadSpeed = formatBytes(liveData.network.up);
  const downloadSpeed = formatBytes(liveData.network.down);
  const totalUpload = formatBytes(liveData.network.totalUp);
  const totalDownload = formatBytes(liveData.network.totalDown);
  //const totalTraffic = formatBytes(liveData.network.totalUp + liveData.network.totalDown);
  return (
    <Card
      style={{
        width: "100%",
        margin: "0 auto",
        transition: "all 0.2s ease-in-out",
      }}
      className="hover:shadow-2xl hover:scale-102 hover:cursor-pointer"
    >
      <Flex direction="column" gap="3">
        <Flex justify="between" align="center">
          <Flex justify="start" align="center">
            <Flag flag={basic.region} />
            <Text
              weight="bold"
              size={isMobile ? "3" : "4"}
              truncate
              style={{ maxWidth: "200px" }}
            >
              {basic.name}
            </Text>
          </Flex>

          <Badge color={online ? "green" : "red"} variant="soft">
            {online ? t("card_online") : t("card_offline")}
          </Badge>
        </Flex>

        <Separator size="4" />

        <Flex direction="column" gap="2">
          <Flex justify="between" hidden={isMobile}>
            <Text size="2" color="gray">
              OS
            </Text>
            <Text size="2">
              {formatOs(basic.os)} - {basic.arch}
            </Text>
          </Flex>
          <Flex className="md:flex-col flex-row md:gap-1 gap-4">
            {/* CPU Usage */}
            <UsageBar label={t("card_cpu")} value={liveData.cpu.usage} />

            {/* Memory Usage */}
            <UsageBar label={t("card_ram")} value={memoryUsagePercent} />
            <Text
              className="md:block hidden"
              size="1"
              color="gray"
              style={{ marginTop: "-4px" }}
            >
              ({formatBytes(liveData.ram.used)} / {formatBytes(basic.mem_total)}
              )
            </Text>

            {/* Disk Usage */}
            <UsageBar label={t("card_disk")} value={diskUsagePercent} />
            <Text
              size="1"
              className="md:block hidden"
              color="gray"
              style={{ marginTop: "-4px" }}
            >
              ({formatBytes(liveData.disk.used)} /{" "}
              {formatBytes(basic.disk_total)})
            </Text>
          </Flex>

          <Flex justify="between" hidden={isMobile}>
            <Text size="2" color="gray">
              {t("card_network_speed")}
            </Text>
            <Text size="2">
              ↑ {uploadSpeed}/s ↓ {downloadSpeed}/s
            </Text>
          </Flex>

          <Flex justify="between" hidden={isMobile}>
            <Text size="2" color="gray">
              {t("card_total_traffic")}
            </Text>
            <Text size="2">
              ↑ {totalUpload}/s ↓ {totalDownload}/s
            </Text>
          </Flex>
          <Flex justify="between" gap="2" hidden={!isMobile}>
            <Text size="2">
              ↑ {uploadSpeed}/s ({totalUpload})
            </Text>
            <Text size="2">
              ↓ {downloadSpeed}/s ({totalDownload})
            </Text>
          </Flex>
          <Flex justify="between">
            <Text size="2" color="gray">
              {t("card_uptime")}
            </Text>
            <Text size="2">{formatUptime(liveData.uptime)}</Text>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
};

export default Node;

type NodeGridProps = {
  nodes: NodeBasicInfo[];
  liveData: LiveData;
};

import { Box } from "@radix-ui/themes";
export const NodeGrid = ({ nodes, liveData }: NodeGridProps) => {
  // 确保liveData是有效的
  const onlineNodes = liveData && liveData.online ? liveData.online : [];

  // 排序节点：先按在线/离线状态排序，再按权重排序（权重大的靠前）
  const sortedNodes = [...nodes].sort((a, b) => {
    const aOnline = onlineNodes.includes(a.uuid);
    const bOnline = onlineNodes.includes(b.uuid);
    
    // 如果一个在线一个离线，在线的排前面
    if (aOnline !== bOnline) {
      return aOnline ? -1 : 1;
    }
    
    // 都是在线或都是离线的情况下，按权重降序排序
    return b.weight - a.weight;
  });

  return (
    <Box
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
        gap: "1.5rem",
        padding: "1rem",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {sortedNodes.map((node) => {
        const isOnline = onlineNodes.includes(node.uuid);
        const nodeData = liveData && liveData.data ? liveData.data[node.uuid] : undefined;
        
        return (
          <Node 
            key={node.uuid} 
            basic={node} 
            live={nodeData} 
            online={isOnline} 
          />
        );
      })}
    </Box>
  );
};
