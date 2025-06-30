import { useTranslation } from "react-i18next";
import { UpDownStack } from "./UpDownStack";
import { useNodeList } from "@/contexts/NodeListContext";
import { useLiveData } from "@/contexts/LiveDataContext";
import { formatBytes, formatUptime } from "./Node";
import { Flex, Text } from "@radix-ui/themes";

type DetailsGridProps = {
  uuid: string;
  gap?: string;
};

export const DetailsGrid = ({ uuid, gap }: DetailsGridProps) => {
  const { t } = useTranslation();

  const { nodeList } = useNodeList();
  const { live_data } = useLiveData();
  const node = nodeList?.find((n) => n.uuid === uuid);

  return (
    <div className={`grid grid-cols-2 gap-${gap ?? "4"} basis-full`}>
      <UpDownStack
        className="md:w-128"
        up="CPU"
        down={`${node?.cpu_name} (x${node?.cpu_cores})`}
      />
      <label className="flex flex-wrap gap-2 gap-x-8">
        <UpDownStack up={t("nodeCard.arch")} down={node?.arch ?? "Unknown"} />

        <UpDownStack
          up={t("nodeCard.virtualization")}
          down={node?.virtualization ?? "Unknown"}
        />
      </label>
      <UpDownStack up="GPU" down={node?.gpu_name ?? "Unknown"} />
      <UpDownStack
        className="md:w-64 w-full"
        up={t("nodeCard.os")}
        down={node?.os ?? "Unknown"}
      />

      <UpDownStack
        className="md:w-64 w-full"
        up={t("nodeCard.networkSpeed")}
        down={` ↑ ${formatBytes(
          live_data?.data.data[uuid ?? ""]?.network.up || 0
        )}/s
              ↓
              ${formatBytes(
                live_data?.data.data[uuid ?? ""]?.network.down || 0
              )}/s`}
      />
      <UpDownStack
        up={t("nodeCard.totalTraffic")}
        down={`↑
              ${formatBytes(
                live_data?.data.data[uuid ?? ""]?.network.totalUp || 0
              )}
              ↓
              ${formatBytes(
                live_data?.data.data[uuid ?? ""]?.network.totalDown || 0
              )}`}
      />
      <UpDownStack
        className="md:w-70 w-full"
        up={t("nodeCard.ram")}
        down={formatBytes(node?.mem_total || 0)}
      />
      <UpDownStack
        up={t("nodeCard.swap")}
        down={formatBytes(node?.swap_total || 0)}
      />
      <UpDownStack
        className="md:w-64 w-full"
        up={t("nodeCard.disk")}
        down={formatBytes(node?.disk_total || 0)}
      />
      <div />
      <UpDownStack
        up={t("nodeCard.uptime")}
        down={
          live_data?.data.data[uuid ?? ""]?.uptime
            ? formatUptime(live_data?.data.data[uuid ?? ""]?.uptime, t)
            : "-"
        }
      />
      <label className="flex flex-wrap gap-2">
        <Flex align={"center"} gap="2">
          <Text size="2" weight="bold" wrap="nowrap">
            {t("nodeCard.last_updated")}
          </Text>
          <Text size="2">
            {node?.updated_at
              ? new Date(
                  live_data?.data.data[uuid ?? ""]?.updated_at ||
                    node.updated_at
                ).toLocaleString()
              : "-"}
          </Text>
        </Flex>
      </label>
    </div>
  );
};
