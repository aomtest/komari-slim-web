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
    uuid: string;
    session: string;
    user_agent: string;
    ip: string;
    login_method: string;
    latest_online: string;
    latest_ip: string;
    last_user_agent: string;
    expires: string;
    created_at: string;
  }>;
  status: string;
};
export default function Sessions() {
  const [t] = useTranslation();
  const [sessions, setSessions] = React.useState<Resp | null>(null);
  React.useEffect(() => {
    fetch("/api/admin/session/get")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then((data:Resp) => {
        setSessions(data);
      })
      .catch((error) => {
        console.error("Error fetching sessions:", error);
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
            data: prev?.data.filter((s) => s.session !== sessionId) || [],
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
    fetch("/api/admin/session/remove/all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        if (!response.ok) {
          toast.error("Error:" + response.status);
          return;
        }
        response
          .json()
          .then(() => {
            window.location.href = "/"; // 登出
          })
          .catch((error) => {
            toast.error("Error parsing JSON:" + error);
          });
      })
      .catch((error) => {
        toast.error(error.message);
      });
  }

  if (!sessions) {
    return <div className="p-4 text-center">{t("sessions.loading")}</div>;
  }
  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">{t("sessions.title")}</h1>
      <div className="mb-4">
        <Dialog>
          <DialogTrigger>
            <Button variant="destructive" size="sm">
              {t("sessions.delete_all")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>{t("sessions.delete_all")}</DialogTitle>
            <DialogDescription>
              {t("sessions.delete_all_desc")}
            </DialogDescription>
            <DialogFooter>
              <DialogTrigger>
                <Button variant="destructive" onClick={deleteAllSessions}>
                  {t("delete")}
                </Button>
              </DialogTrigger>
              <DialogTrigger>
                <Button variant="secondary">{t("sessions.cancel")}</Button>
              </DialogTrigger>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-hidden rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("sessions.session_id")}</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>{t("sessions.created_at")}</TableHead>
              <TableHead>{t("sessions.expires_at")}</TableHead>
              <TableHead>{t("sessions.last_login","上次登录")}</TableHead>
              <TableHead>{t("sessions.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.data.map((s) => {
              const isCurrent = s.session === sessions.current;
              return (
                <TableRow key={s.uuid}>
                  <TableCell>
                    {s.session}
                    {isCurrent && (
                      <span className="ml-2 text-sm text-blue-600">
                        {t("sessions.current")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{s.ip}</TableCell>
                  <TableCell>
                    {new Date(s.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>{new Date(s.expires).toLocaleString()}</TableCell>
                  <TableCell>{new Date(s.latest_online).toLocaleString()}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger>
                        <Button variant="destructive" size="sm">
                          {t("delete")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogTitle>
                          {t("sessions.confirm_delete")}
                        </DialogTitle>
                        <DialogDescription>
                          {t("sessions.delete_one_desc")}
                        </DialogDescription>
                        <DialogFooter>
                          <DialogTrigger>
                            <Button
                              variant="destructive"
                              onClick={() => deleteSession(s.session)}
                            >
                              {t("delete")}
                            </Button>
                          </DialogTrigger>
                          <DialogTrigger>
                            <Button variant="secondary">
                              {t("sessions.cancel")}
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
