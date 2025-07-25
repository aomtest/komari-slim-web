import { Callout, Card, Flex, Text, Popover, IconButton, Switch } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import NodeDisplay from "../components/NodeDisplay";
import { formatBytes } from "@/components/Node";
import { useLiveData } from "../contexts/LiveDataContext";
import { useNodeList } from "@/contexts/NodeListContext";
import Loading from "@/components/loading";
import { Settings } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

// Intelligent speed formatting function
const formatSpeed = (bytes: number): string => {
  if (bytes === 0) return "0 B/s";
  const units = ["B/s", "KB/s", "MB/s", "GB/s", "TB/s"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  
  // Adaptive decimal places
  let decimals = 2;
  if (i >= 3) decimals = 1; // GB and above: 1 decimal
  if (i <= 1) decimals = 0; // B and KB: no decimals
  if (size >= 100) decimals = 0; // 100+ of any unit: no decimals
  
  return `${size.toFixed(decimals)} ${units[i]}`;
};

const Index = () => {
  const InnerLayout = () => {
    const [t] = useTranslation();
    const { live_data } = useLiveData();
    //document.title = t("home_title");
    //#region 节点数据
    const { nodeList, isLoading, error } = useNodeList();
    
    // Status cards visibility state
    const [statusCardsVisibility, setStatusCardsVisibility] = useLocalStorage('statusCardsVisibility', {
      currentTime: true,
      currentOnline: true,
      regionOverview: true,
      trafficOverview: true,
      networkSpeed: true
    });
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
        <Card className="summary-card mx-4 md:text-base text-sm relative">
          <div className="absolute top-2 right-2">
            <Popover.Root>
              <Popover.Trigger>
                <IconButton variant="ghost" size="1">
                  <Settings size={16} />
                </IconButton>
              </Popover.Trigger>
              <Popover.Content width="300px">
                <Flex direction="column" gap="3">
                  <Text size="2" weight="bold">{t("status_settings")}</Text>
                  <Flex direction="column" gap="2">
                    <Flex justify="between" align="center">
                      <Text size="2">{t("current_time")}</Text>
                      <Switch
                        checked={statusCardsVisibility.currentTime}
                        onCheckedChange={(checked) =>
                          setStatusCardsVisibility({
                            ...statusCardsVisibility,
                            currentTime: checked,
                          })
                        }
                      />
                    </Flex>
                    <Flex justify="between" align="center">
                      <Text size="2">{t("current_online")}</Text>
                      <Switch
                        checked={statusCardsVisibility.currentOnline}
                        onCheckedChange={(checked) =>
                          setStatusCardsVisibility({
                            ...statusCardsVisibility,
                            currentOnline: checked,
                          })
                        }
                      />
                    </Flex>
                    <Flex justify="between" align="center">
                      <Text size="2">{t("region_overview")}</Text>
                      <Switch
                        checked={statusCardsVisibility.regionOverview}
                        onCheckedChange={(checked) =>
                          setStatusCardsVisibility({
                            ...statusCardsVisibility,
                            regionOverview: checked,
                          })
                        }
                      />
                    </Flex>
                    <Flex justify="between" align="center">
                      <Text size="2">{t("traffic_overview")}</Text>
                      <Switch
                        checked={statusCardsVisibility.trafficOverview}
                        onCheckedChange={(checked) =>
                          setStatusCardsVisibility({
                            ...statusCardsVisibility,
                            trafficOverview: checked,
                          })
                        }
                      />
                    </Flex>
                    <Flex justify="between" align="center">
                      <Text size="2">{t("network_speed")}</Text>
                      <Switch
                        checked={statusCardsVisibility.networkSpeed}
                        onCheckedChange={(checked) =>
                          setStatusCardsVisibility({
                            ...statusCardsVisibility,
                            networkSpeed: checked,
                          })
                        }
                      />
                    </Flex>
                  </Flex>
                </Flex>
              </Popover.Content>
            </Popover.Root>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {statusCardsVisibility.currentTime && (
              <Flex
                direction="row"
                justify="between"
                align="center"
              >
                <Text>{t("current_time")}</Text>
                <Text>{new Date().toLocaleString()}</Text>
              </Flex>
            )}
            
            {statusCardsVisibility.currentOnline && (
              <Flex
                direction="row"
                justify="between"
                align="center"
              >
                <Text>{t("current_online")}</Text>
                <Text>
                  {live_data?.data?.online.length ?? 0} / {nodeList?.length ?? 0}
                </Text>
              </Flex>
            )}

            {statusCardsVisibility.regionOverview && (
              <Flex
                direction="row"
                justify="between"
                align="center"
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
            )}

            {statusCardsVisibility.trafficOverview && (
              <Flex
                direction="row"
                justify="between"
                align="center"
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
            )}
            
            {statusCardsVisibility.networkSpeed && (
              <Flex
                direction="row"
                justify="between"
                align="center"
              >
                <Text>{t("network_speed")}</Text>
                <Text>
                  {"↑ " +
                    formatSpeed(
                      live_data?.data?.data
                        ? Object.values(live_data.data.data).reduce(
                            (acc, node) => {
                              return acc + (node.network.up || 0);
                            },
                            0
                          )
                        : 0
                    )}{" "}
                  /{" "}
                  {"↓ " +
                    formatSpeed(
                      live_data?.data?.data
                        ? Object.values(live_data.data.data).reduce(
                            (acc, node) => {
                              return acc + (node.network.down || 0);
                            },
                            0
                          )
                        : 0
                    )}
                </Text>
              </Flex>
            )}
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
