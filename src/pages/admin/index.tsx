import { useState } from "react";
import type { NodeInfo } from "../../types/admin/NodeInfo";
import { useEffect } from "react";
import { Flex, IconButton, Strong, Text } from "@radix-ui/themes";
import NodeCard from "../../components/admin/NodeCard";
import { useTranslation } from "react-i18next";
import React from "react";
import { PlusIcon } from "@radix-ui/react-icons";
type MeResp = { logged_in: boolean; username: string };

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

  const [me, setMe] = React.useState<MeResp>({
    logged_in: false,
    username: "",
  });

  React.useEffect(() => {
    const fetchMe = async () => {
      try {
        const resp = await fetch("./api/me", { cache: "force-cache" });
        const data = await resp.json();
        if (resp.status === 200) {
          setMe({ logged_in: data.logged_in, username: data.username });
        }
      } catch (err) {
        console.error("Failed to fetch user info", err);
      }
    };

    fetchMe();
  }, []);
  return (
    <Flex direction="column" gap="2">
      <Text size="6">
        <Strong>{t("panel_welcome", { username: me.username })}</Strong>
      </Text>
      <Flex justify="end" gap="3">
        <IconButton >
          <PlusIcon />
        </IconButton>
      </Flex>
      {node && node.map((n) => <NodeCard key={n.uuid} data={n} />)}
    </Flex>
  );
};

export default Admin;
