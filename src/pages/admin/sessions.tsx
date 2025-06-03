import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { DialogTitle, DialogTrigger } from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";

type Resp = {
  current: string;
  data: Array<{
    UUID: string;
    Session: string;
    Expires: string;
    CreatedAt: string;
  }>;
  status: string;
};
export default function Sessions() {
  const [t] = useTranslation();
  const [sessions, setSessions] = React.useState<Resp | null>(null);
  React.useEffect(() => {
    fetch("/api/admin/session/get")
      .then((response) => response.json())
      .then((data: Resp) => {
        setSessions(data);
      })
      .catch((error) => {
        toast.error(error.message);
      });
  }, []);

  function deleteSession(sessionId: string) {
    const isCurrent = sessionId === sessions?.current;
    fetch("/api/admin/session/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session: sessionId }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          toast.success("会话已删除");
          if (isCurrent) {
            window.location.href = "/"; // 登出
            return;
          }
          setSessions((prev) => ({
            ...prev!,
            data: prev?.data.filter((s) => s.Session !== sessionId) || [],
          }));
        } else {
          console.error("Failed to delete session:", data);
          toast.error("删除失败");
        }
      })
      .catch((error) => {
        console.error("Error deleting session:", error);
        toast.error(error.message);
      });
  }
  function deleteAllSessions() {
    if (!window.confirm("删除全部会话将导致您被登出，是否继续？")) return;
    fetch("/api/admin/session/remove/all")
      .then((response) => {
        if (!response.ok) {
          toast.error("删除全部失败");
          return;
        }
        response.json().then(() => {
          window.location.href = "/"; // 登出
        });
      })
      .catch((error) => {
        toast.error(error.message);
      });
  }

  if (!sessions) {
    return <div>加载中...</div>;
  }
  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">会话管理</h1>
      <div className="mb-4">
        <Dialog>
          <DialogTrigger>
            <Button variant="destructive" size="sm">
              删除全部会话
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>删除全部会话</DialogTitle>
            <DialogDescription>
              此操作将删除所有会话，是否继续？
            </DialogDescription>
            <DialogFooter>
              <DialogTrigger>
                <Button variant="destructive" onClick={deleteAllSessions}>
                  {t("delete")}
                </Button>
              </DialogTrigger>
              <DialogTrigger>
                <Button variant="secondary">
                  {t("admin.nodeTable.cancel")}
                </Button>
              </DialogTrigger>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-hidden rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>会话 ID</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead>过期时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.data.map((s) => {
              const isCurrent = s.Session === sessions.current;
              return (
                <TableRow key={s.UUID}>
                  <TableCell>
                    {s.Session}
                    {isCurrent && (
                      <span className="ml-2 text-sm text-blue-600">(当前)</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(s.CreatedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{new Date(s.Expires).toLocaleString()}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger>
                        <Button variant="destructive" size="sm">
                          删除
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogTitle>确认删除</DialogTitle>
                        <DialogDescription>
                          确定要删除此会话吗？
                        </DialogDescription>
                        <DialogFooter>
                          <DialogTrigger>
                            <Button
                              variant="destructive"
                              onClick={() => deleteSession(s.Session)}
                            >
                              {t("delete")}
                            </Button>
                          </DialogTrigger>
                          <DialogTrigger>
                            <Button variant="secondary">
                              {t("admin.nodeTable.cancel")}
                            </Button>
                          </DialogTrigger>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
