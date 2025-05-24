import { Card, Flex, Text } from "@radix-ui/themes";
import React from "react";
import { useTranslation } from "react-i18next";
import { NodeGrid } from "../components/Node";
import { formatBytes, type NodeResponse } from "../types/NodeBasicInfo";
import { useLiveData } from "../contexts/LiveDataContext";

const Index = () => {
  const [t] = useTranslation();
  const { live_data } = useLiveData();
  document.title = t("home_title");
  //#region 节点数据
  const [node, setNode] = React.useState<NodeResponse | null>(null);

  React.useEffect(() => {
    fetch("./api/nodes")
      .then((res) => res.json())
      .then((data) => setNode(data))
      .catch((err) => console.error(err));
  }, []);
  //#endregion

  return (
    <>
      <Card className="mx-4 md:text-base text-sm">
        <div className="flex md:flex-row flex-col md:gap-4 gap-1 justify-between md:items-center">
          <Flex
            direction="row"
            justify="between"
            align="center"
            flexBasis={"20%"}
          >
            <Text>{t("current_time")}</Text>
            <Text>{new Date().toLocaleString()}</Text>
          </Flex>
          <div
            className="h-6 w-0.5 md:block hidden"
            style={{ backgroundColor: "var(--accent-5)" }}
          />
          <Flex
            direction="row"
            justify="between"
            align="center"
            flexBasis={"20%"}
          >
            <Text>{t("current_online")}</Text>
            <Text>
              {live_data?.data?.online.length ?? 0} / {node?.data?.length ?? 0}
            </Text>
          </Flex>
          <div
            className="h-6 w-0.5 md:block hidden"
            style={{ backgroundColor: "var(--accent-5)" }}
          />

          <Flex
            direction="row"
            justify="between"
            align="center"
            flexBasis={"20%"}
          >
            <Text>{t("region_overview")}</Text>
            <Text>
              {node?.data
                ? Object.entries(
                    node.data.reduce((acc, item) => {
                      acc[item.region] = (acc[item.region] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).length
                : 0}
            </Text>
          </Flex>
          <div
            className="h-6 w-0.5 md:block hidden"
            style={{ backgroundColor: "var(--accent-5)" }}
          />

          <Flex
            direction="row"
            justify="between"
            align="center"
            flexBasis={"20%"}
          >
            <Text>{t("traffic_overview")}</Text>
            <Text>
              {"↑ " +
                formatBytes(
                  live_data?.data?.data
                    ? Object.values(live_data.data.data).reduce((acc, node) => {
                        return acc + (node.network.totalUp || 0);
                      }, 0)
                    : 0
                )}{" "}
              /{" "}
              {"↓ " +
                formatBytes(
                  live_data?.data?.data
                    ? Object.values(live_data.data.data).reduce((acc, node) => {
                        return acc + (node.network.totalDown || 0);
                      }, 0)
                    : 0
                )}
            </Text>
          </Flex>
        </div>
      </Card>
      <NodeGrid
        nodes={node?.data ?? []}
        liveData={live_data?.data ?? { online: [], data: {} }}
      />{" "}
    </>
  );
};

export default Index;
