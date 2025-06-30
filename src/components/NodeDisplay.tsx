import React, { useState, useMemo, useRef, useEffect } from "react";
import { Flex, Text, IconButton, TextField } from "@radix-ui/themes";
import { Search, Grid3X3, Table2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { NodeBasicInfo } from "@/contexts/NodeListContext";
import type { LiveData } from "../types/LiveData";
import { NodeGrid } from "./Node";
import NodeTable from "./NodeTable";
import { isRegionMatch } from "@/utils/regionHelper";
import "./NodeDisplay.css";

export type ViewMode = "grid" | "table";

interface NodeDisplayProps {
  nodes: NodeBasicInfo[];
  liveData: LiveData;
}

const NodeDisplay: React.FC<NodeDisplayProps> = ({ nodes, liveData }) => {
  const [t] = useTranslation();
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>(
    "nodeViewMode",
    "grid"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 按 "/" 键聚焦搜索框
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      // 按 Escape 键清空搜索
      if (e.key === "Escape" && searchTerm) {
        setSearchTerm("");
        searchRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchTerm]);

  // 过滤节点
  const filteredNodes = useMemo(() => {
    if (!searchTerm.trim()) return nodes;

    const term = searchTerm.toLowerCase().trim();
    return nodes.filter((node) => {
      // 基本信息搜索
      const basicMatch =
        node.name.toLowerCase().includes(term) ||
        node.os.toLowerCase().includes(term) ||
        node.arch.toLowerCase().includes(term);

      // 地区搜索（支持emoji和地区名称）
      const regionMatch = isRegionMatch(node.region, term);

      // 价格搜索（如果输入数字）
      const priceMatch =
        !isNaN(Number(term)) && node.price.toString().includes(term);

      // 状态搜索
      const isOnline = liveData?.online?.includes(node.uuid) || false;
      const statusMatch =
        ((term === "online" || term === "在线") && isOnline) ||
        ((term === "offline" || term === "离线") && !isOnline);

      return basicMatch || regionMatch || priceMatch || statusMatch;
    });
  }, [nodes, searchTerm, liveData]);

  return (
    <div className="w-full">
      {/* 控制栏 */}
      <Flex
        direction={{ initial: "column", sm: "row" }}
        justify="between"
        align={{ initial: "stretch", sm: "center" }}
        gap="4"
        className="mb-2 p-4 bg-accent-1 rounded-lg"
      >
        {/* 搜索框 */}
        <Flex align="center" gap="2" className="flex-1 max-w-md relative">
          <TextField.Root
            ref={searchRef}
            placeholder={t("search.placeholder", {
              defaultValue: "搜索节点名称、地区、系统...",
            })}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 pr-8"
          >
            <TextField.Slot>
              <Search size={16} />
            </TextField.Slot>
          </TextField.Root>
          {searchTerm && (
            <IconButton
              variant="ghost"
              size="1"
              className="absolute right-2 h-6 w-6 search-clear-button"
              onClick={() => {
                setSearchTerm("");
                searchRef.current?.focus();
              }}
            >
              <X size={12} />
            </IconButton>
          )}
        </Flex>

        {/* 视图模式切换 */}
        <Flex align="center" gap="2">
          <label className="whitespace-nowrap text-md text-muted-foreground">
            {t("view.mode", { defaultValue: "显示模式" })}
          </label>
          <Flex gap="1">
            <IconButton
              variant={viewMode === "grid" ? "solid" : "soft"}
              onClick={() => setViewMode("grid")}
              className="transition-colors view-switch-button"
            >
              <Grid3X3 size={16} />
            </IconButton>
            <IconButton
              variant={viewMode === "table" ? "solid" : "soft"}
              onClick={() => setViewMode("table")}
              className="transition-colors view-switch-button"
            >
              <Table2 size={16} />
            </IconButton>
          </Flex>
        </Flex>
      </Flex>

      {/* 搜索结果统计 */}
      <Flex justify="between" align="center" className="mx-4 mb-2">
        {searchTerm.trim() ? (
          <Text size="2" color="gray">
            {t("search.results", {
              count: filteredNodes.length,
              total: nodes.length,
              defaultValue: `找到 ${filteredNodes.length} 个服务器，共 ${nodes.length} 个`,
            })}
          </Text>
        ) : (
          <Text size="2" color="gray">
            {t("nodeCard.totalNodes", {
              total: nodes.length,
              online: liveData?.online?.length || 0,
              defaultValue: `共 ${nodes.length} 个节点，${
                liveData?.online?.length || 0
              } 个在线`,
            })}
          </Text>
        )}
      </Flex>

      {/* 节点显示区域 */}
      {filteredNodes.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          justify="center"
          className="py-16 mx-4"
        >
          <Text size="4" color="gray" className="mb-2">
            {searchTerm.trim()
              ? t("search.no_results", { defaultValue: "未找到匹配的节点" })
              : t("nodes.empty", { defaultValue: "暂无节点数据" })}
          </Text>
          {searchTerm.trim() && (
            <Text size="2" color="gray">
              {t("search.try_different", {
                defaultValue: "尝试不同的搜索关键词",
              })}
            </Text>
          )}
        </Flex>
      ) : (
        <>
          {viewMode === "grid" ? (
            <NodeGrid nodes={filteredNodes} liveData={liveData} />
          ) : (
            <NodeTable nodes={filteredNodes} liveData={liveData} />
          )}
        </>
      )}
    </div>
  );
};

export default NodeDisplay;
