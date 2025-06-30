import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge, Flex, IconButton } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { NodeBasicInfo } from "@/contexts/NodeListContext";
import type { LiveData, Record } from "../types/LiveData";
import { formatBytes, formatUptime } from "./Node";
import UsageBar from "./UsageBar";
import Flag from "./Flag";
import PriceTags from "./PriceTags";
import Tips from "./ui/tips";
import { DetailsGrid } from "./DetailsGrid";
import MiniPingChart from "./MiniPingChart";
import { getOSImage } from "@/utils";

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
            <TableHead>OS</TableHead>
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

                  <TableCell className="w-4">
                    <img src={getOSImage(node.os)} alt={node.os} className="w-5 h-5 mr-2" />
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
                        <label>↑{formatBytes(nodeData.network.up)}/s</label>
                        <label>↓{formatBytes(nodeData.network.down)}/s</label>
                      </Flex>
                    </Flex>
                  </TableCell>
                  <TableCell>
                    <Flex direction="column" gap="1">
                      <label>↑{formatBytes(nodeData.network.totalUp)}</label>
                      <label>↓{formatBytes(nodeData.network.totalDown)}</label>
                    </Flex>
                  </TableCell>
                </TableRow>

                {/* 展开的详细信息行 */}
                {isExpanded && (
                  <TableRow className="expanded-row">
                    <TableCell colSpan={10} className="bg-accent-1">
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

const ExpandedNodeDetails: React.FC<ExpandedNodeDetailsProps> = ({ node }) => {
  return (
    <div className="p-4 space-y-4">
      <DetailsGrid gap="0" uuid={node.uuid} />
      <div>
        <MiniPingChart hours={24} uuid={node.uuid} />
      </div>
    </div>
  );
};

export default NodeTable;
