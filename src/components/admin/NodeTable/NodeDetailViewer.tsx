import { z } from "zod";
import { schema } from "@/components/admin/NodeTable/schema/node";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";
import { t } from "i18next";

export function TableCellViewer({ item }: { item: z.infer<typeof schema> }) {
  const isMobile = useIsMobile();

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.name}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.name}</DrawerTitle>
          <DrawerDescription>
            {t("admin.nodeDetail.machineDetail", "机器详细信息")}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <form className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="detail-ip">
                  {t("admin.nodeDetail.ipAddress", "IP 地址")}
                </Label>
                <div className="flex flex-col gap-1">
                  {item.ipv4 && (
                    <div className="flex items-center gap-1">
                      <div
                        id="detail-ipv4"
                        className="bg-muted px-3 py-2 rounded border flex-1 min-w-0"
                      >
                        {item.ipv4}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-5"
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(item.ipv4!);
                        }}
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                  )}
                  {item.ipv6 && (
                    <div className="flex items-center gap-1">
                      <div
                        id="detail-ipv6"
                        className="bg-muted px-3 py-2 rounded border flex-1 min-w-0"
                      >
                        {item.ipv6}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-5"
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(item.ipv6!);
                        }}
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="detail-version">
                  {t("admin.nodeDetail.clientVersion", "客户端版本")}
                </Label>
                <div
                  id="detail-version"
                  className="bg-muted px-3 py-2 rounded border"
                >
                  {item.version || (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="detail-os">
                  {t("admin.nodeDetail.os", "操作系统")}
                </Label>
                <div
                  id="detail-os"
                  className="bg-muted px-3 py-2 rounded border"
                >
                  {item.os || <span className="text-muted-foreground">-</span>}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="detail-arch">
                  {t("admin.nodeDetail.arch", "架构")}
                </Label>
                <div
                  id="detail-arch"
                  className="bg-muted px-3 py-2 rounded border"
                >
                  {item.arch || (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="detail-cpu_name">
                  {t("admin.nodeDetail.cpu", "CPU")}
                </Label>
                <div
                  id="detail-cpu_name"
                  className="bg-muted px-3 py-2 rounded border"
                >
                  {item.cpu_name || (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="detail-cpu_cores">
                  {t("admin.nodeDetail.cpuCores", "CPU 核心数")}
                </Label>
                <div
                  id="detail-cpu_cores"
                  className="bg-muted px-3 py-2 rounded border"
                >
                  {item.cpu_cores || (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="detail-mem_total">
                  {t("admin.nodeDetail.memTotal", "总内存 (Bytes)")}
                </Label>
                <div
                  id="detail-mem_total"
                  className="bg-muted px-3 py-2 rounded border"
                >
                  {item.mem_total || (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="detail-disk_total">
                  {t("admin.nodeDetail.diskTotal", "总磁盘空间 (Bytes)")}
                </Label>
                <div
                  id="detail-disk_total"
                  className="bg-muted px-3 py-2 rounded border"
                >
                  {item.disk_total || (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="detail-gpu_name">
                {t("admin.nodeDetail.gpu", "GPU")}
              </Label>
              <div
                id="detail-gpu_name"
                className="bg-muted px-3 py-2 rounded border"
              >
                {item.gpu_name || (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="detail-uuid">
                {t("admin.nodeDetail.uuid", "UUID")}
              </Label>
              <div
                id="detail-uuid"
                className="bg-muted px-3 py-2 rounded border"
              >
                {item.uuid || <span className="text-muted-foreground">-</span>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="detail-createdAt">
                  {t("admin.nodeDetail.createdAt", "创建时间")}
                </Label>
                <div
                  id="detail-createdAt"
                  className="bg-muted px-3 py-2 rounded border"
                >
                  {item.created_at ? (
                    new Date(item.created_at).toLocaleString()
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="detail-updatedAt">
                  {t("admin.nodeDetail.updatedAt", "更新时间")}
                </Label>
                <div
                  id="detail-updatedAt"
                  className="bg-muted px-3 py-2 rounded border"
                >
                  {item.updated_at ? (
                    new Date(item.updated_at).toLocaleString()
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button>{t("admin.nodeDetail.done", "完成")}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
