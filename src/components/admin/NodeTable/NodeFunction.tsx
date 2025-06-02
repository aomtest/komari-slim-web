import * as React from "react";
import { z } from "zod";
import { schema } from "@/components/admin/NodeTable/schema/node";
import { DataTableRefreshContext } from "@/components/admin/NodeTable/schema/DataTableRefreshContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Terminal, Trash2, Copy, Link } from "lucide-react";
import { t } from "i18next";
import type { Row } from "@tanstack/react-table";
import { EditDialog } from "./NodeEditDialog";
import {
  Checkbox,
  Flex,
  SegmentedControl, TextArea
} from "@radix-ui/themes";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

async function removeClient(uuid: string) {
  await fetch(`/api/admin/client/${uuid}/remove`, {
    method: "POST",
  });
}

type InstallOptions = {
  disableWebSsh: boolean;
  disableAutoUpdate: boolean;
  ignoreUnsafeCert: boolean;
  ghproxy: string;
  dir: string;
  serviceName: string;
};

type Platform = "linux" | "windows";

export function ActionsCell({ row }: { row: Row<z.infer<typeof schema>> }) {
  const refreshTable = React.useContext(DataTableRefreshContext);
  const [removing, setRemoving] = React.useState(false);
  const [selectedPlatform, setSelectedPlatform] =
    React.useState<Platform>("linux");
  const [installOptions, setInstallOptions] = React.useState<InstallOptions>({
    disableWebSsh: false,
    disableAutoUpdate: false,
    ignoreUnsafeCert: false,
    ghproxy: "",
    dir: "",
    serviceName: "",
  });

  const generateCommand = () => {
    const host = window.location.origin;
    const token = row.original.token;

    let baseCommand = "";
    let options = "";

    // 根据安装选项生成参数
    if (installOptions.disableWebSsh) {
      options += " --disable-web-ssh";
    }
    if (installOptions.disableAutoUpdate) {
      options += " --disable-auto-update";
    }
    if (installOptions.ignoreUnsafeCert) {
      options += " --ignore-unsafe-cert";
    }
    if (installOptions.ghproxy) {
      if (!installOptions.ghproxy.startsWith("http")) {
        installOptions.ghproxy = `http://${installOptions.ghproxy}`;
      }
      options += ` --install-ghproxy ${installOptions.ghproxy}`;
    }
    if (installOptions.dir) {
      options += ` --install-dir ${installOptions.dir}`;
    }
    if (installOptions.serviceName) {
      options += ` --install-service-name ${installOptions.serviceName}`;
    }

    switch (selectedPlatform) {
      case "linux":
        baseCommand = `bash <(curl -sL https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.sh) -e ${host} -t ${token}`;
        break;
      case "windows":
        baseCommand = `powershell -Command "Invoke-RestMethod -Uri 'https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.ps1' | Invoke-Expression" -Host ${host} -Token ${token}`;
        break;
    }
    return baseCommand + options;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("copy_success", "已复制到剪贴板"));
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      <Dialog>
        <DialogTrigger>
          <Button variant="ghost" size="icon">
            <Link />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("admin.nodeTable.installCommand", "一键部署指令")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <SegmentedControl.Root
              value={selectedPlatform}
              onValueChange={(value) => setSelectedPlatform(value as Platform)}
            >
              <SegmentedControl.Item value="linux">Linux</SegmentedControl.Item>
              <SegmentedControl.Item value="windows">
                Windows (暂未实现)
              </SegmentedControl.Item>
            </SegmentedControl.Root>

            <Flex direction="column" gap="2">
              <label className="text-base font-bold">
                {t("admin.nodeTable.installOptions", "安装选项")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Flex gap="2">
                  <Checkbox
                    checked={installOptions.disableWebSsh}
                    onCheckedChange={(checked) => {
                      setInstallOptions((prev) => ({
                        ...prev,
                        disableWebSsh: Boolean(checked),
                      }));
                    }}
                  />
                  <label
                    className="text-sm font-normal"
                    onClick={() => {
                      setInstallOptions((prev) => ({
                        ...prev,
                        disableWebSsh: !prev.disableWebSsh,
                      }));
                    }}
                  >
                    {t("admin.nodeTable.disableWebSsh", "禁用 WebSSH")}
                  </label>
                </Flex>
                <Flex gap="2">
                  <Checkbox
                    checked={installOptions.disableAutoUpdate}
                    onCheckedChange={(checked) => {
                      setInstallOptions((prev) => ({
                        ...prev,
                        disableAutoUpdate: Boolean(checked),
                      }));
                    }}
                  ></Checkbox>
                  <label
                    className="text-sm font-normal"
                    onClick={() => {
                      setInstallOptions((prev) => ({
                        ...prev,
                        disableAutoUpdate: !prev.disableAutoUpdate,
                      }));
                    }}
                  >
                    {t("admin.nodeTable.disableAutoUpdate", "禁用自动更新")}
                  </label>
                </Flex>
                <Flex gap="2">
                  <Checkbox
                    checked={installOptions.ignoreUnsafeCert}
                    onCheckedChange={(checked) => {
                      setInstallOptions((prev) => ({
                        ...prev,
                        ignoreUnsafeCert: Boolean(checked),
                      }));
                    }}
                  />
                  <label
                    className="text-sm font-normal"
                    onClick={() => {
                      setInstallOptions((prev) => ({
                        ...prev,
                        ignoreUnsafeCert: !prev.ignoreUnsafeCert,
                      }));
                    }}
                  >
                    {t("admin.nodeTable.ignoreUnsafeCert", "忽略不安全证书")}
                  </label>
                </Flex>
              </div>
              <Flex direction="column" gap="2">
                <label className="text-sm font-bold">
                  {t("admin.nodeTable.ghproxy", "GitHub 代理")}
                </label>
                <Input
                  placeholder={t(
                    "admin.nodeTable.ghproxy_placeholder",
                    "GitHub 代理，为空则不适用代理"
                  )}
                  onChange={(e) =>
                    setInstallOptions((prev) => ({
                      ...prev,
                      ghproxy: e.target.value,
                    }))
                  }
                ></Input>
                <label className="text-sm font-bold">
                  {t("admin.nodeTable.install_dir", "安装目录")}
                </label>
                <Input
                  placeholder={t(
                    "admin.nodeTable.install_dir_placeholder",
                    "安装目录，为空则使用默认目录(/opt/komari-agent)"
                  )}
                  onChange={(e) =>
                    setInstallOptions((prev) => ({
                      ...prev,
                      dir: e.target.value,
                    }))
                  }
                ></Input>
                <label className="text-sm font-bold">
                  {t("admin.nodeTable.serviceName", "服务名称")}
                </label>
                <Input
                  placeholder={t(
                    "admin.nodeTable.serviceName_placeholder",
                    "服务名称，为空则使用默认名称(komari-agent)"
                  )}
                  onChange={(e) =>
                    setInstallOptions((prev) => ({
                      ...prev,
                      serviceName: e.target.value,
                    }))
                  }
                ></Input>
              </Flex>
            </Flex>
            <Flex direction="column" gap="2">
              <label className="text-base font-bold">
                {t("admin.nodeTable.generatedCommand", "生成的指令")}
              </label>
              <div className="relative">
                <TextArea
                  disabled
                  className="w-full"
                  style={{ minHeight: "80px" }}
                  value={generateCommand()}
                />
              </div>
            </Flex>
            <Flex justify="center">
              <Button
                style={{ width: "100%" }}
                variant="outline"
                onClick={() => copyToClipboard(generateCommand())}
              >
                <Copy />
                {t("copy")}
              </Button>
            </Flex>
          </div>
        </DialogContent>
      </Dialog>
      <Button
        variant="ghost"
        size="icon"
        onClick={() =>
          window.open(`/terminal?uuid=${row.original.uuid}`, "_blank")
        }
      >
        <Terminal />
      </Button>
      <EditDialog item={row.original} />
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="text-destructive">
            <Trash2 />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.nodeTable.confirmDelete")}</DialogTitle>{" "}
            <DialogDescription>
              {t("admin.nodeTable.cannotUndo")}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" asChild>
              <DialogTrigger>{t("admin.nodeTable.cancel")}</DialogTrigger>
            </Button>
            <Button
              variant="destructive"
              disabled={removing}
              onClick={async () => {
                setRemoving(true);
                await removeClient(row.original.uuid);
                setRemoving(false);
                if (refreshTable) refreshTable();
              }}
              asChild
            >
              <DialogTrigger>
                {removing
                  ? t("admin.nodeTable.deleting")
                  : t("admin.nodeTable.confirm")}
              </DialogTrigger>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
