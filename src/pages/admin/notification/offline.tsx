import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  NodeDetailsProvider,
  useNodeDetails,
} from "@/contexts/NodeDetailsContext";
import {
  OfflineNotificationProvider,
  useOfflineNotification,
  type OfflineNotification,
} from "@/contexts/NotificationContext";
import React from "react";
import { Pencil, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Dialog,
  Flex,
  IconButton,
  Switch,
  TextField,
} from "@radix-ui/themes";
import { toast } from "sonner";
import Loading from "@/components/loading";

const OfflinePage = () => {
  return (
    <OfflineNotificationProvider>
      <NodeDetailsProvider>
        <InnerLayout />
      </NodeDetailsProvider>
    </OfflineNotificationProvider>
  );
};
const InnerLayout = () => {
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<string[]>([]);
  const {
    loading: onLoading,
    error: onError,
    offlineNotification,
    refresh,
  } = useOfflineNotification();
  const { isLoading: onNodeLoading, error: onNodeError } = useNodeDetails();
  const { t } = useTranslation();
  const [batchLoading, setBatchLoading] = React.useState(false);

  const handleBatchAction = (enable: boolean) => {
    setBatchLoading(true);
    const payload = selected.map((id) => {
      const n = offlineNotification.find((n) => n.client === id);
      return {
        client: id,
        enable,
        cooldown: n?.cooldown ?? 1800,
        grace_period: n?.grace_period ?? 300,
      };
    });
    fetch("/api/admin/notification/offline/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) {
          toast.error("Failed to update offline notifications: " + res.statusText);
        } else {
          toast.success(t("common.updated_successfully"));
        }
        return res.json();
      })
      .then(() => {
        setBatchLoading(false);
        refresh();
      })
      .catch((error) => {
        console.error("Error updating offline notifications:", error);
        toast.error(t("common.error", { message: error.message }));
        setBatchLoading(false);
      });
  };

  if (onLoading || onNodeLoading) {
    return <Loading text="(o゜▽゜)o☆" />;
  }
  if (onError || onNodeError) {
    return <div>Error: {onError?.message || onNodeError}</div>;
  }
  return (
    <div className="flex flex-col gap-4 md:p-4 p-1">
      <Flex justify="between" align="center" wrap="wrap">
        <label className="text-2xl font-semibold">
          {t("notification.offline.full_title", "离线通知设置")}
        </label>
        <TextField.Root
          type="text"
          className="max-w-64"
          placeholder={t("common.search")}
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
        >
          <TextField.Slot>
            <Search size={16} />
          </TextField.Slot>
        </TextField.Root>
      </Flex>
      <OfflineNotificationTable
        search={search}
        selected={selected}
        onSelectionChange={setSelected}
      />
      <label className="text-sm text-muted-foreground">
        {t("common.selected", {
          count: selected.length,
        })}
      </label>
      <Flex gap="2" align="center">
        <Button
          variant="soft"
          color="red"
          onClick={() => handleBatchAction(false)}
          disabled={batchLoading || selected.length === 0}
        >
          批量禁用
        </Button>
        <Button
          variant="soft"
          onClick={() => handleBatchAction(true)}
          disabled={batchLoading || selected.length === 0}
        >
          批量启用
        </Button>
      </Flex>
      <label className="text-sm text-muted-foreground">
        <span
          dangerouslySetInnerHTML={{ __html: t("notification.offline.tips") }}
        />
      </label>
    </div>
  );
};

const OfflineNotificationTable = ({
  search,
  selected,
  onSelectionChange,
}: {
  search: string;
  selected: string[];
  onSelectionChange: (ids: string[]) => void;
}) => {
  const { offlineNotification } = useOfflineNotification();
  const { nodeDetail } = useNodeDetails();
  const { t } = useTranslation();
  // sort by weight desc and filter by search
  const filtered = [...nodeDetail]
    .sort((a, b) => b.weight - a.weight)
    .filter((node) => node.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-6">
              <Checkbox
                checked={
                  selected.length === filtered.length
                    ? true
                    : selected.length > 0
                    ? "indeterminate"
                    : false
                }
                onCheckedChange={(checked) =>
                  onSelectionChange(checked ? filtered.map((n) => n.uuid) : [])
                }
              />
            </TableHead>
            <TableHead>{t("common.server")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead>{t("notification.offline.cooldown")}</TableHead>
            <TableHead>{t("notification.offline.grace_period")}</TableHead>
            <TableHead>{t("common.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((node) => (
            <TableRow key={node.uuid}>
              <TableCell>
                <Checkbox
                  checked={selected.includes(node.uuid)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onSelectionChange([...selected, node.uuid]);
                    } else {
                      onSelectionChange(
                        selected.filter((id) => id !== node.uuid)
                      );
                    }
                  }}
                />
              </TableCell>
              <TableCell>{node.name}</TableCell>
              <TableCell>
                {offlineNotification.find((n) => n.client === node.uuid)?.enable
                  ? t("common.enabled")
                  : t("common.disabled")}
              </TableCell>
              <TableCell>
                {offlineNotification.find((n) => n.client === node.uuid)
                  ?.cooldown || 1800}{" "}
                {t("nodeCard.time_second")}
              </TableCell>
              <TableCell>
                {offlineNotification.find((n) => n.client === node.uuid)
                  ?.grace_period || 300}{" "}
                {t("nodeCard.time_second")}
              </TableCell>
              <TableCell>
                <ActionButtons
                  offlineNotifications={offlineNotification.find(
                    (n) => n.client === node.uuid
                  )}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const ActionButtons = ({
  offlineNotifications,
}: {
  offlineNotifications: OfflineNotification | undefined;
}) => {
  const { t } = useTranslation();
  const { refresh } = useOfflineNotification();
  const [editOpen, setEditOpen] = React.useState(false);
  const [editSaving, setEditSaving] = React.useState(false);

  const handleEditSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEditSaving(true);
    fetch("/api/admin/notification/offline/edit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{
        client: offlineNotifications?.client,
        enable: e.currentTarget.status.checked,
        cooldown: parseInt(e.currentTarget.cooldown.value, 10),
        grace_period: parseInt(e.currentTarget.grace_period.value, 10),
      }]),
    })
      .then((res) => {
        if (!res.ok) {
          toast.error(
            "Failed to save offline notification settings: " + res.statusText
          );
        }
        toast.success(t("common.updated_successfully"));
        return res.json();
      })
      .then(() => {
        setEditOpen(false);
        refresh();
        setEditSaving(false);
      })
      .catch((error) => {
        console.error("Error saving offline notification settings:", error);
        toast.error(t("common.error", { message: error.message }));
      });
    
  };
  return (
    <Flex gap="2" align="center">
      <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
        <Dialog.Trigger>
          <IconButton variant="ghost">
            <Pencil size={16} />
          </IconButton>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>{t("common.edit")}</Dialog.Title>
          <Flex gap="2" direction="column">
            <form onSubmit={handleEditSave} className="flex flex-col gap-2">
              <label htmlFor="status">{t("common.status")}</label>
              <Switch
                id="status"
                name="status"
                defaultChecked={offlineNotifications?.enable}
              />
              <label htmlFor="cooldown">
                {t("notification.offline.cooldown")}
              </label>
              <TextField.Root
                type="number"
                min={0}
                defaultValue={offlineNotifications?.cooldown}
                id="cooldown"
                name="cooldown"
              />
              <label htmlFor="grace_period">
                {t("notification.offline.grace_period")}
              </label>
              <TextField.Root
                type="number"
                min={0}
                defaultValue={offlineNotifications?.grace_period}
                id="grace_period"
                name="grace_period"
              />
              <Flex gap="2" justify="end" className="mt-4">
                <Dialog.Close>
                  <Button variant="soft" color="gray">
                    {t("common.cancel")}
                  </Button>
                </Dialog.Close>
                <Button variant="solid" type="submit" disabled={editSaving}>
                  {t("common.save")}
                </Button>
              </Flex>
            </form>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Flex>
  );
};

export default OfflinePage;
