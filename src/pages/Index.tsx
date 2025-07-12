import { Callout, Card, Flex, Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import NodeDisplay from "../components/NodeDisplay";
import { formatBytes } from "@/components/Node";
import { useLiveData } from "../contexts/LiveDataContext";
import { useNodeList } from "@/contexts/NodeListContext";
import Loading from "@/components/loading";

const Index = () => {
  const InnerLayout = () => {
    const [t] = useTranslation();
    const { live_data } = useLiveData();
    //document.title = t("home_title");
    //#region 节点数据
    const { nodeList, isLoading, error } = useNodeList();
    if (isLoading) {
      return <Loading />;
    }
    if (error) {
      return <div>Error: {error}</div>;
    }
    //#endregion
    return (
      <>
        <Callouts />
        <Card className="summary-card mx-4 md:text-base text-sm">
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
                {live_data?.data?.online.length ?? 0} / {nodeList?.length ?? 0}
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
                {nodeList
                  ? Object.entries(
                      nodeList.reduce((acc, item) => {
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
                      ? Object.values(live_data.data.data).reduce(
                          (acc, node) => {
                            return acc + (node.network.totalUp || 0);
                          },
                          0
                        )
                      : 0
                  )}{" "}
                /{" "}
                {"↓ " +
                  formatBytes(
                    live_data?.data?.data
                      ? Object.values(live_data.data.data).reduce(
                          (acc, node) => {
                            return acc + (node.network.totalDown || 0);
                          },
                          0
                        )
                      : 0
                  )}
              </Text>
            </Flex>
          </div>
        </Card>
        <NodeDisplay
          nodes={nodeList ?? []}
          liveData={live_data?.data ?? { online: [], data: {} }}
        />
      </>
    );
  };
  return <InnerLayout />;
};

//#region Callouts
const Callouts = () => {
  const [t] = useTranslation();
  const { showCallout } = useLiveData();
  const ishttps = window.location.protocol === "https:";
  return (
    <Flex direction="column" gap="2" className="m-2">
      <Callout.Root m="2" hidden={ishttps} color="red">
        <Callout.Icon>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M10.03 3.659c.856-1.548 3.081-1.548 3.937 0l7.746 14.001c.83 1.5-.255 3.34-1.969 3.34H4.254c-1.715 0-2.8-1.84-1.97-3.34zM12.997 17A.999.999 0 1 0 11 17a.999.999 0 0 0 1.997 0m-.259-7.853a.75.75 0 0 0-1.493.103l.004 4.501l.007.102a.75.75 0 0 0 1.493-.103l-.004-4.502z"
            />
          </svg>
        </Callout.Icon>
        <Callout.Text>
          <Text size="2" weight="medium">
            {t("warn_https")}
          </Text>
        </Callout.Text>
      </Callout.Root>
      <Callout.Root m="2" hidden={showCallout} id="callout" color="tomato">
        <Callout.Icon>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M21.707 3.707a1 1 0 0 0-1.414-1.414L18.496 4.09a4.25 4.25 0 0 0-5.251.604l-1.068 1.069a1.75 1.75 0 0 0 0 2.474l3.585 3.586a1.75 1.75 0 0 0 2.475 0l1.068-1.068a4.25 4.25 0 0 0 .605-5.25zm-11 8a1 1 0 0 0-1.414-1.414l-1.47 1.47l-.293-.293a.75.75 0 0 0-1.06 0l-1.775 1.775a4.25 4.25 0 0 0-.605 5.25l-1.797 1.798a1 1 0 1 0 1.414 1.414l1.798-1.797a4.25 4.25 0 0 0 5.25-.605l1.775-1.775a.75.75 0 0 0 0-1.06l-.293-.293l1.47-1.47a1 1 0 0 0-1.414-1.414l-1.47 1.47l-1.586-1.586z"
            />
          </svg>
        </Callout.Icon>
        <Callout.Text>
          <Text size="2" weight="medium">
            {t("warn_websocket")}
          </Text>
        </Callout.Text>
      </Callout.Root>
    </Flex>
  );
};
// #endregion Callouts
export default Index;
