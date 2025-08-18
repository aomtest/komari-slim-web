import Loading from "@/components/loading";
import NodeSelectorDialog from "@/components/NodeSelectorDialog";
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
  PingTaskProvider,
  usePingTask,
  type PingTask,
} from "@/contexts/PingTaskContext";
import { useSettings } from "@/lib/api";
import {
  Button,
  Dialog,
  Flex,
  IconButton,
  Select,
  TextField,
} from "@radix-ui/themes";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const PingTask = () => {
  return (
    <PingTaskProvider>
      <NodeDetailsProvider>
        <InnerLayout />
      </NodeDetailsProvider>
    </PingTaskProvider>
  );
};

const InnerLayout = () => {
  const { pingTasks, isLoading, error } = usePingTask();
  const { isLoading: nodeDetailLoading, error: nodeDetailError } =
    useNodeDetails();
  const { t } = useTranslation();
  if (isLoading || nodeDetailLoading) {
    return <Loading />;
  }
  if (error || nodeDetailError) {
    return <div>{error || nodeDetailError}</div>;
  }
  return (
    <Flex direction="column" gap="4" className="p-4">
      <div className="flex justify-between items-center">
        <label className="text-2xl font-bold">{t("ping.title")}</label>
        <AddButton />
      </div>

      <div className="rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableHead>{t("common.name")}</TableHead>
            <TableHead>{t("common.server")}</TableHead>
            <TableHead>{t("ping.target")}</TableHead>
            <TableHead>{t("ping.type")}</TableHead>
            <TableHead>{t("ping.interval")}</TableHead>
            <TableHead>{t("common.action")}</TableHead>
          </TableHeader>
          <TableBody>
            {pingTasks
              ?.slice()
              .sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
              .map((task) => (
                <Row key={task.id} task={task} />
              ))}
          </TableBody>
        </Table>
      </div>
      
      <DiskUsageEstimate />
    </Flex>
  );
};

const Row = ({ task }: { task: PingTask }) => {
  const { t } = useTranslation();
  const { refresh } = usePingTask();
  const { nodeDetail } = useNodeDetails();
  const [editOpen, setEditOpen] = React.useState(false);
  const [editSaving, setEditSaving] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [form, setForm] = React.useState({
    name: task.name || "",
    type: task.type || "icmp",
    target: task.target || "",
    clients: task.clients || [],
    interval: task.interval || 60,
  });

  const submitEdit = (newForm: typeof form) => {
    setEditSaving(true);
    fetch("/api/admin/ping/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tasks: [
          {
            id: task.id,
            name: newForm.name,
            type: newForm.type,
            target: newForm.target,
            clients: newForm.clients,
            interval: newForm.interval,
          },
        ],
      }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data?.message || t("common.error"));
          });
        }
        return res.json();
      })
      .then(() => {
        setEditOpen(false);
        toast.success(t("common.updated_successfully"));
        refresh();
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => setEditSaving(false));
  };

  // 编辑提交
  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitEdit(form);
  };

  // 删除
  const handleDelete = () => {
    setDeleteLoading(true);
    fetch("/api/admin/ping/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: [task.id] }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data?.message || t("common.error"));
          });
        }
        return res.json();
      })
      .then(() => {
        setDeleteOpen(false);
        toast.success(t("common.deleted_successfully"));
        refresh();
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => setDeleteLoading(false));
  };

  return (
    <TableRow key={task.id}>
      <TableCell>{task.name}</TableCell>
      <TableCell>
        <Flex gap="2" align="center">
          {task.clients && task.clients.length > 0
            ? (() => {
                const names = task.clients.map((uuid) => {
                  const name =
                    nodeDetail.find((node) => node.uuid === uuid)?.name || uuid;
                  return name;
                });
                const joined = names.join(", ");
                return joined.length > 40
                  ? joined.slice(0, 40) + "..."
                  : joined;
              })()
            : t("common.none")}
          <NodeSelectorDialog
            value={form.clients ?? []}
            onChange={(uuids) => {
              setForm((f) => ({ ...f, clients: uuids }));
              submitEdit({ ...form, clients: uuids });
            }}
          >
            <IconButton variant="ghost">
              <MoreHorizontal size="16" />
            </IconButton>
          </NodeSelectorDialog>
        </Flex>
      </TableCell>
      <TableCell>{task.target}</TableCell>
      <TableCell>{task.type}</TableCell>
      <TableCell>{task.interval}</TableCell>
      <TableCell className="flex items-center gap-2">
        {/* 编辑按钮 */}
        <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
          <Dialog.Trigger>
            <IconButton variant="soft">
              <Pencil size="16" />
            </IconButton>
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Title>{t("common.edit")}</Dialog.Title>
            <form onSubmit={handleEdit} className="flex flex-col gap-2">
              <label>{t("common.name")}</label>
              <TextField.Root
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
              <label>{t("ping.type")}</label>
              <Select.Root
                value={form.type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, type: v as any }))
                }
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="icmp">ICMP</Select.Item>
                  <Select.Item value="tcp">TCP</Select.Item>
                  <Select.Item value="http">HTTP</Select.Item>
                </Select.Content>
              </Select.Root>
              <label>{t("ping.target")}</label>
              <TextField.Root
                value={form.target}
                onChange={(e) =>
                  setForm((f) => ({ ...f, target: e.target.value }))
                }
                required
              />
              <label>{t("common.server")}</label>
              <Flex>
                <NodeSelectorDialog
                  value={form.clients}
                  onChange={(v) => setForm((f) => ({ ...f, clients: v }))}
                />
              </Flex>
              <label>
                {t("ping.interval")} ({t("time.second")})
              </label>
              <TextField.Root
                type="number"
                value={form.interval}
                onChange={(e) =>
                  setForm((f) => ({ ...f, interval: Number(e.target.value) }))
                }
                required
              />
              <Flex gap="2" justify="end" className="mt-4">
                <Dialog.Close>
                  <Button
                    variant="soft"
                    color="gray"
                    type="button"
                    onClick={() => setEditOpen(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                </Dialog.Close>
                <Button variant="solid" type="submit" disabled={editSaving}>
                  {t("common.save")}
                </Button>
              </Flex>
            </form>
          </Dialog.Content>
        </Dialog.Root>
        {/* 删除按钮 */}
        <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
          <Dialog.Trigger>
            <IconButton variant="soft" color="red">
              <Trash size="16" />
            </IconButton>
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Title>{t("common.delete")}</Dialog.Title>
            <Flex gap="2" justify="end" className="mt-4">
              <Dialog.Close>
                <Button
                  variant="soft"
                  color="gray"
                  type="button"
                  onClick={() => setDeleteOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
              </Dialog.Close>
              <Button
                variant="solid"
                color="red"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {t("common.delete")}
              </Button>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
      </TableCell>
    </TableRow>
  );
};

const DiskUsageEstimate = () => {
  const { pingTasks } = usePingTask();
  const { t } = useTranslation();

  // 计算预估磁盘消耗
  const calculateDiskUsage = () => {
    if (!pingTasks || pingTasks.length === 0) return 0;

    // 一条记录的大小估算：
    // - uuid: 36字节 (UUID字符串)
    // - int: 8字节 (64位整数)
    // - int: 8字节 (64位整数) 
    // - time: 33字节 (RFC3339格式字符串，如 "2006-01-02T15:04:05.000Z07:00")
    // - 其他开销: 20字节
    const recordSize = (36 + 8 + 8 + 33 + 20) * 2; // 回收余量2倍

    const totalRecordsPerDay = pingTasks.reduce((total, task) => {
      const clientCount = task.clients?.length || 0;
      const interval = task.interval || 60; // 默认60秒
      const recordsPerDay = clientCount * (24 * 60 * 60) / interval;
      return total + recordsPerDay;
    }, 0);

    return totalRecordsPerDay * recordSize;
  };

  // 格式化文件大小
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const {settings} = useSettings();

  const dailyUsage = calculateDiskUsage();
  //const monthlyUsage = dailyUsage * 31;
  //const yearlyUsage = dailyUsage * 365;

  return (
    <div className="text-sm text-muted-foreground">
      <label>
        {t("ping.disk_usage_estimate")}: {formatBytes(dailyUsage)}/
        {t("common.day")}, {t('ping.disk_usage_with_settings',{hour:settings.ping_record_preserve_time,space:formatBytes(dailyUsage * settings.ping_record_preserve_time/24)})}
      </label>
    </div>
  );
};

const AddButton: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>([]);
  const { refresh } = usePingTask();
  const [selectedType, setSelectedType] = React.useState<
    "icmp" | "tcp" | "http"
  >("icmp");
  const [saving, setSaving] = React.useState(false);
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      name: e.currentTarget.ping_name.value,
      type: selectedType,
      target: e.currentTarget.ping_target.value,
      clients: selected,
      interval: parseInt(e.currentTarget.interval.value, 10),
    };
    setSaving(true);
    fetch("/api/admin/ping/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (response.ok) {
          setIsOpen(false);
          setSelected([]);
          setSelectedType("icmp");
          toast.success(t("common.success"));
        } else {
          response
            .json()
            .then((data) => {
              toast.error(data?.message || t("common.error"));
            })
            .catch((error) => {
              toast.error(error.message);
            });
        }
      })
      .catch((error) => {
        console.error("Error adding ping task:", error);
        toast.error(error.message);
      })
      .finally(() => {
        setSaving(false);
        refresh();
      });
  };
  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger>
        <Button>{t("common.add")}</Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>{t("common.add")}</Dialog.Title>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" justify="end" gap="2" className="font-bold">
            <label htmlFor="ping_name">{t("common.name")}</label>
            <TextField.Root id="ping_name" name="ping_name" />
            <label htmlFor="type">{t("ping.type")}</label>
            <Select.Root
              value={selectedType}
              onValueChange={(value) =>
                setSelectedType(value as "icmp" | "tcp" | "http")
              }
            >
              <Select.Trigger id="type" name="type" />
              <Select.Content>
                <Select.Item value="icmp">ICMP</Select.Item>
                <Select.Item value="tcp">TCP</Select.Item>
                <Select.Item value="http">HTTP</Select.Item>
              </Select.Content>
            </Select.Root>
            <label htmlFor="ping_target">{t("ping.target")}</label>
            <TextField.Root
              id="ping_target"
              name="ping_target"
              placeholder="1.1.1.1 | 1.1.1.1:80 | https://1.1.1.1"
            />
            <label htmlFor="ping_server">{t("common.server")}</label>
            <div className="flex items-center justify-start gap-2">
              <NodeSelectorDialog value={selected} onChange={setSelected} />
              <label className="text-md font-normal">
                {t("common.selected", { count: selected.length })}
              </label>
            </div>
            <label htmlFor="interval">
              {t("ping.interval")} ({t("time.second")})
            </label>
            <TextField.Root
              id="interval"
              name="interval"
              defaultValue={60}
              type="number"
              placeholder="60"
            />
            <div className="flex justify-end gap-2">
              <Dialog.Close>
                <Button variant="soft">{t("common.close")}</Button>
              </Dialog.Close>
              <Button disabled={saving} type="submit">
                {t("common.add")}
              </Button>
            </div>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default PingTask;
