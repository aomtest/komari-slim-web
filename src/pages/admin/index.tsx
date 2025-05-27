import { useState } from "react";
import type { NodeInfo } from "../../types/admin/NodeInfo";
import { useEffect } from "react";
import { DataTable } from "@/components/admin/NodeTable";
import { useTranslation } from "react-i18next";
import { PlusIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
// type MeResp = { logged_in: boolean; username: string };

const Admin = () => {
  const { t } = useTranslation();
  const [node, useNode] = useState<NodeInfo[] | null>(null);
  useEffect(() => {
    const fetchNodeInfo = async () => {
      try {
        const response = await fetch("./api/admin/client/list");
        if (!response.ok) {
          useNode(null);
        }
        const data: NodeInfo[] = await response.json();
        useNode(data);
      } catch (error) {
        useNode(null);
      }
    };
    fetchNodeInfo();
  }, []);

  // 已删除me和setMe相关代码

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          {t("admin.nodeList", "节点列表")}
        </h1>
        <Button>
          <PlusIcon className="mr-1" />
          {t("admin.addNode", "添加节点")}
        </Button>
      </div>
      <div>
        {node ? (
          <DataTable data={node} />
        ) : (
          <div>{t("admin.loading", "加载中...")}</div>
        )}
      </div>
    </div>
  );
};

export default Admin;