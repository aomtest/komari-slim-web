import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge, Flex, Text, IconButton } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { NodeBasicInfo } from "@/contexts/NodeListContext";
import type { LiveData, Record } from "../types/LiveData";
import { formatBytes, formatUptime } from "./Node";
import UsageBar from "./UsageBar";
import Flag from "./Flag";
import PriceTags from "./PriceTags";
import MiniPingChartFloat from "./MiniPingChartFloat";
import Tips from "./ui/tips";

interface NodeTableProps {
  nodes: NodeBasicInfo[];
  liveData: LiveData;
}

const NodeTable: React.FC<NodeTableProps> = ({ nodes, liveData }) => {
  const [t] = useTranslation();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpansion = (uuid: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(uuid)) {
        newSet.delete(uuid);
      } else {
        newSet.add(uuid);
      }
      return newSet;
    });
  };

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

    // 都是在线或都是离线的情况下，按权重升序排序（权重大的在后面）
    return a.weight - b.weight;
  });

  const getNodeData = (uuid: string): Record => {
    const defaultLive = {
      cpu: { usage: 0 },
      ram: { used: 0 },
      disk: { used: 0 },
      network: { up: 0, down: 0, totalUp: 0, totalDown: 0 },
      uptime: 0,
    } as Record;

    return liveData && liveData.data
      ? liveData.data[uuid] || defaultLive
      : defaultLive;
  };

  return (
    <div className="mx-4 overflow-x-auto rounded-xl node-table-container">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[24px]"></TableHead>
            <TableHead className="w-[200px] min-w-[150px]">
              {t("nodeCard.name")}
            </TableHead>
            <TableHead className="max-w-[128px]">
              {t("nodeCard.status")}
            </TableHead>
            <TableHead>{t("nodeCard.cpu")}</TableHead>
            <TableHead>{t("nodeCard.ram")}</TableHead>
            <TableHead>{t("nodeCard.disk")}</TableHead>
            <TableHead></TableHead>
            <TableHead>{t("nodeCard.networkSpeed")}</TableHead>
            <TableHead>{t("nodeCard.totalTraffic")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedNodes.map((node) => {
            const isOnline = onlineNodes.includes(node.uuid);
            const nodeData = getNodeData(node.uuid);
            const isExpanded = expandedRows.has(node.uuid);

            const memoryUsagePercent = node.mem_total
              ? (nodeData.ram.used / node.mem_total) * 100
              : 0;
            const diskUsagePercent = node.disk_total
              ? (nodeData.disk.used / node.disk_total) * 100
              : 0;

            return (
              <React.Fragment key={node.uuid}>
                <TableRow
                  className="hover:bg-accent-2 transition-colors duration-200 table-row-hover"
                  onClick={() => toggleRowExpansion(node.uuid)}
                >
                  <TableCell>
                    <div className="flex justify-center items-center">
                      <IconButton
                        variant="ghost"
                        size="1"
                        className={`expand-button ${
                          isExpanded ? "expanded" : ""
                        }`}
                        aria-label="Expand row"
                      >
                        <ChevronRight size={16} />
                      </IconButton>
                    </div>
                  </TableCell>

                  <TableCell className="node-name-cell">
                    <Flex align="center" gap="1">
                      <Flag flag={node.region} />
                      <Link
                        to={`/instance/${node.uuid}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Flex direction="column" gap="0">
                          <label className="max-w-[150px] font-bold text-lg truncate">
                            {node.name}
                          </label>
                          {isOnline ? (
                            <label className="-mt-1 text-muted-foreground text-xs">
                              {formatUptime(nodeData.uptime, t)}
                            </label>
                          ) : (
                            <label className="-mt-1 text-muted-foreground">
                              -
                            </label>
                          )}
                        </Flex>
                      </Link>
                    </Flex>
                  </TableCell>

                  <TableCell>
                    <Flex
                      direction="row"
                      justify="start"
                      align="center"
                      gap="1"
                    >
                      <div>
                        <Badge
                          color={isOnline ? "green" : "red"}
                          variant="soft"
                          size="1"
                        >
                          {isOnline
                            ? t("nodeCard.online")
                            : t("nodeCard.offline")}
                        </Badge>
                      </div>
                      {nodeData.message && (
                        <Tips color="#CE282E">{nodeData.message}</Tips>
                      )}
                    </Flex>
                  </TableCell>

                  <TableCell>
                    <div className="w-[100px]">
                      <UsageBar label="" value={nodeData.cpu.usage} compact />
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="w-[100px]">
                      <UsageBar label="" value={memoryUsagePercent} compact />
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="w-[100px]">
                      <UsageBar label="" value={diskUsagePercent} compact />
                    </div>
                  </TableCell>
                  <TableCell>
                    <PriceTags
                      price={node.price}
                      billing_cycle={node.billing_cycle}
                      expired_at={node.expired_at}
                      currency={node.currency}
                      gap="1"
                    />
                  </TableCell>
                  <TableCell>
                    <Flex direction="column" gap="1">
                      <Flex direction="column" gap="1">
                        <Text size="2">
                          ↑{formatBytes(nodeData.network.up)}/s ↓
                          {formatBytes(nodeData.network.down)}/s
                        </Text>
                      </Flex>
                    </Flex>
                  </TableCell>
                  <TableCell>
                    <Flex direction="column" gap="1">
                      <Text size="2">
                        {formatBytes(nodeData.network.totalUp)} /{" "}
                        {formatBytes(nodeData.network.totalDown)}
                      </Text>
                    </Flex>
                  </TableCell>
                </TableRow>

                {/* 展开的详细信息行 */}
                {isExpanded && (
                  <TableRow className="expanded-row">
                    <TableCell colSpan={9} className="bg-accent-1">
                      <div className="expand-content">
                        <ExpandedNodeDetails node={node} nodeData={nodeData} />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

// 展开的节点详细信息组件
interface ExpandedNodeDetailsProps {
  node: NodeBasicInfo;
  nodeData: Record;
}

const ExpandedNodeDetails: React.FC<ExpandedNodeDetailsProps> = ({
  node,
  nodeData,
}) => {
  const [t] = useTranslation();

  return (
    <div className="p-4 space-y-4">
      <Flex direction="column" gap="3">
        {/* 基本信息 */}
        <div>
          <Text size="3" weight="bold" className="mb-2 block">
            {t("nodeCard.basicInfo", { defaultValue: "基本信息" })}
          </Text>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Text size="1" color="gray">
                {t("nodeCard.os")}
              </Text>
              <Text size="2" weight="medium">
                {node.os} - {node.arch}
              </Text>
            </div>
            <div>
              <Text size="1" color="gray">
                CPU
              </Text>
              <Text size="2" weight="medium">
                {node.cpu_name}
              </Text>
              <Text size="1" color="gray">
                ({node.cpu_cores} 核心)
              </Text>
            </div>
            <div>
              <Text size="1" color="gray">
                GPU
              </Text>
              <Text size="2" weight="medium">
                {node.gpu_name || "Unknown"}
              </Text>
            </div>
            <div>
              <Text size="1" color="gray">
                {t("nodeCard.virtualization")}
              </Text>
              <Text size="2" weight="medium">
                {node.virtualization || "Unknown"}
              </Text>
            </div>
          </div>
        </div>

        {/* 资源使用情况 */}
        <div>
          <Text size="3" weight="bold" className="mb-2 block">
            {t("nodeCard.resourceUsage", { defaultValue: "资源使用" })}
          </Text>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Flex justify="between" align="center" className="mb-1">
                <Text size="2" color="gray">
                  {t("nodeCard.ram")}
                </Text>
                <Text size="2">
                  {formatBytes(nodeData.ram.used)} /{" "}
                  {formatBytes(node.mem_total)}
                </Text>
              </Flex>
              <UsageBar
                label=""
                value={
                  node.mem_total
                    ? (nodeData.ram.used / node.mem_total) * 100
                    : 0
                }
              />
            </div>
            <div>
              <Flex justify="between" align="center" className="mb-1">
                <Text size="2" color="gray">
                  {t("nodeCard.disk")}
                </Text>
                <Text size="2">
                  {formatBytes(nodeData.disk.used)} /{" "}
                  {formatBytes(node.disk_total)}
                </Text>
              </Flex>
              <UsageBar
                label=""
                value={
                  node.disk_total
                    ? (nodeData.disk.used / node.disk_total) * 100
                    : 0
                }
              />
            </div>
            <div>
              <Flex justify="between" align="center" className="mb-1">
                <Text size="2" color="gray">
                  {t("nodeCard.swap")}
                </Text>
                <Text size="2">{formatBytes(node.swap_total)}</Text>
              </Flex>
            </div>
          </div>
        </div>

        {/* Ping 图表和其他信息 */}
        <div>
          <Text size="3" weight="bold" className="mb-2 block">
            {t("nodeCard.monitoring", { defaultValue: "监控信息" })}
          </Text>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Text size="2" color="gray" className="mb-2 block">
                {t("nodeCard.ping")}{" "}
                {t("nodeCard.chart", { defaultValue: "图表" })}
              </Text>
              <MiniPingChartFloat
                uuid={node.uuid}
                trigger={
                  <div className="w-full h-24 bg-accent-2 rounded-md flex items-center justify-center cursor-pointer hover:bg-accent-3 transition-colors">
                    <Text size="2" color="gray">
                      {t("nodeCard.clickToViewPing", {
                        defaultValue: "点击查看延迟图表",
                      })}
                    </Text>
                  </div>
                }
              />
            </div>
            <div className="space-y-2">
              <div>
                <Text size="1" color="gray">
                  {t("nodeCard.last_updated")}
                </Text>
                <Text size="2" weight="medium">
                  {nodeData.updated_at
                    ? new Date(nodeData.updated_at).toLocaleString()
                    : "-"}
                </Text>
              </div>
              <div>
                <Text size="1" color="gray">
                  UUID
                </Text>
                <Text
                  size="2"
                  weight="medium"
                  className="font-mono text-xs break-all"
                >
                  {node.uuid}
                </Text>
              </div>
            </div>
          </div>
        </div>
      </Flex>
    </div>
  );
};

export default NodeTable;
