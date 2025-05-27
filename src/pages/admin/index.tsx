import { useState } from "react";
import type { NodeInfo } from "../../types/admin/NodeInfo";
import { useEffect } from "react";
import { DataTable } from "@/components/admin/NodeTable";
import { useTranslation } from "react-i18next";
import { PlusIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";

const Admin = () => {
  const { t } = useTranslation();
  const [nodes, setNodes] = useState<NodeInfo[] | null>(null);

  useEffect(() => {
    const fetchNodeInfo = async () => {
      try {
        const response = await fetch("./api/admin/client/list");
        if (!response.ok) {
          setNodes(null);
          return;
        }
        const data: NodeInfo[] = await response.json();
        setNodes(data);
      } catch (error) {
        setNodes(null);
        console.error("Failed to fetch node info:", error);
      }
    };
    fetchNodeInfo();
  }, []);

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
        {nodes ? (
          <DataTable data={nodes} />
        ) : (
          <div>{t("admin.loading", "加载中...")}</div>
        )}
      </div>
    </div>
  );
};

export default Admin;
