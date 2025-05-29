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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Terminal, Trash2, Copy, Check, Link } from "lucide-react";
import { t } from "i18next";
import type { Row } from "@tanstack/react-table";
import { EditDialog } from "./NodeEditDialog";

async function removeClient(uuid: string) {
  await fetch(`/api/admin/client/${uuid}/remove`, {
    method: "POST",
  });
}

export function ActionsCell({ row }: { row: Row<z.infer<typeof schema>> }) {
  const refreshTable = React.useContext(DataTableRefreshContext);
  const [removing, setRemoving] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const generateLinuxCommand = () => {
    const host = window.location.origin;
    const token = row.original.token;
    return `bash <(curl -sL https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.sh) -e ${host} -t ${token}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Link />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => copyToClipboard(generateLinuxCommand())}
            className="flex items-center gap-2"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            Linux
          </DropdownMenuItem>
          <DropdownMenuItem disabled>Windows (敬请期待)</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
