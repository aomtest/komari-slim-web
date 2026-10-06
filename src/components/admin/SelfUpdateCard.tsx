import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { SettingCardCollapse } from "@/components/admin/SettingCard";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  RefreshCw,
  RotateCcw,
} from "lucide-react";

/** 后端 /api/admin/self-update/check 的响应。 */
interface UpdateAsset {
  id: number;
  name: string;
  size: number;
  digest: string;
}

interface UpdateInfo {
  current: string;
  latest: string;
  update_available: boolean;
  tag: string;
  asset: UpdateAsset;
  release_notes: string;
  published_at: string;
  can_update: boolean;
  blocked_reason?: string;
  has_backup: boolean;
}

/** 后端任务状态。stage 的取值见 selfupdate.go 里的常量。 */
interface UpdateTask {
  id: string;
  kind: "update" | "rollback";
  stage: string;
  progress: number;
  downloaded: number;
  total: number;
  from_version: string;
  to_version: string;
  error?: string;
  failed_stage?: string;
  recovered: boolean;
}

type View =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "result"; info: UpdateInfo }
  | { kind: "running"; task: UpdateTask }
  | { kind: "error"; message: string };

/**
 * 把字节数格式化成人类可读的大小。
 */
function formatBytes(n: number): string {
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * 面板内的服务端自更新卡片。
 *
 * 放在「关于」页里，用设置卡片的形态而不是弹窗 —— 与现有管理页的视觉语言
 * 保持一致。更新过程会重启服务，所以进度是内联显示的，重启期间连接必然断开。
 */
export default function SelfUpdateCard() {
  const { t } = useTranslation();
  const [view, setView] = useState<View>({ kind: "idle" });
  const [currentVersion, setCurrentVersion] = useState("");
  const pollTimer = useRef<number | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  const cleanup = useCallback(() => {
    if (pollTimer.current !== null) {
      window.clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/self-update/status");
      const json = await res.json();
      if (json?.data?.current) setCurrentVersion(json.data.current);
      return json?.data?.task as UpdateTask | null;
    } catch {
      return null;
    }
  }, []);

  const check = useCallback(async () => {
    setView({ kind: "checking" });
    try {
      const res = await fetch("/api/admin/self-update/check");
      const json = await res.json();
      if (json.status !== "success") {
        setView({ kind: "error", message: json.message || t("selfUpdate.checkFailed") });
        return;
      }
      const info: UpdateInfo = json.data;
      setCurrentVersion(info.current);
      setView({ kind: "result", info });
    } catch (e) {
      setView({ kind: "error", message: String(e) });
    }
  }, [t]);

  /**
   * 重启之后确认结果。
   *
   * 进程重启会断开所有连接，所以「重启成功」这个事件传不出来，只能靠轮询：
   * 新进程启动后会读回持久化的任务状态，并用它自己的版本号判断成败。
   */
  const pollUntilSettled = useCallback(
    async (deadline: number) => {
      if (Date.now() > deadline) {
        setView({
          kind: "error",
          message: t("selfUpdate.statusUnknown"),
        });
        return;
      }
      const task = await fetchStatus();
      if (task && (task.stage === "succeeded" || task.stage === "rolled_back")) {
        setView({ kind: "running", task });
        return;
      }
      if (task && (task.stage === "failed" || task.stage === "unknown")) {
        setView({ kind: "running", task });
        return;
      }
      pollTimer.current = window.setTimeout(() => pollUntilSettled(deadline), 2000);
    },
    [fetchStatus, t]
  );

  /** 订阅进度事件；收到 restarting 后主动断开，转为轮询。 */
  const subscribe = useCallback(
    (taskId: string) => {
      const source = new EventSource("/api/admin/self-update/events");
      sourceRef.current = source;

      source.addEventListener("stage", (ev) => {
        try {
          const task: UpdateTask = JSON.parse((ev as MessageEvent).data);
          if (task.id !== taskId) return;
          setView({ kind: "running", task });
          if (task.stage === "restarting") {
            source.close();
            sourceRef.current = null;
            pollUntilSettled(Date.now() + 90_000);
          }
        } catch {
          /* 忽略解析失败的事件 */
        }
      });

      source.addEventListener("done", (ev) => {
        try {
          const task: UpdateTask = JSON.parse((ev as MessageEvent).data);
          if (task.id !== taskId) return;
          setView({ kind: "running", task });
        } catch {
          /* 同上 */
        }
        source.close();
        sourceRef.current = null;
      });

      source.onerror = () => {
        // 重启期间连接断开是预期行为，不当作错误处理 —— 交给轮询判定。
        source.close();
        sourceRef.current = null;
      };
    },
    [pollUntilSettled]
  );

  const start = useCallback(
    async (info: UpdateInfo) => {
      try {
        const res = await fetch("/api/admin/self-update/apply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // 后端对这个接口要求自定义 header 作为 CSRF 纵深防御。
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({ tag: info.tag, digest: info.asset.digest }),
        });
        const json = await res.json();
        if (json.status !== "success") {
          setView({ kind: "error", message: json.message || t("selfUpdate.startFailed") });
          return;
        }
        const taskId: string = json.data.task_id;
        setView({
          kind: "running",
          task: {
            id: taskId,
            kind: "update",
            stage: "queued",
            progress: 0,
            downloaded: 0,
            total: info.asset.size,
            from_version: info.current,
            to_version: info.tag,
            recovered: false,
          },
        });
        subscribe(taskId);
      } catch (e) {
        setView({ kind: "error", message: String(e) });
      }
    },
    [subscribe, t]
  );

  const rollback = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/self-update/rollback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      const json = await res.json();
      if (json.status !== "success") {
        setView({ kind: "error", message: json.message || t("selfUpdate.rollbackFailed") });
        return;
      }
      const taskId: string = json.data.task_id;
      setView({
        kind: "running",
        task: {
          id: taskId,
          kind: "rollback",
          stage: "queued",
          progress: 0,
          downloaded: 0,
          total: 0,
          from_version: currentVersion,
          to_version: "",
          recovered: false,
        },
      });
      subscribe(taskId);
    } catch (e) {
      setView({ kind: "error", message: String(e) });
    }
  }, [currentVersion, subscribe, t]);

  // 首次挂载时先看有没有遗留的任务状态（比如上次更新后重启过）。
  useEffect(() => {
    void (async () => {
      const task = await fetchStatus();
      if (task && !["succeeded", "failed", "rolled_back"].includes(task.stage)) {
        setView({ kind: "running", task });
        subscribe(task.id);
      }
    })();
  }, [fetchStatus, subscribe]);

  const stageLabel = (stage: string) => {
    const key = `selfUpdate.stage_${stage}`;
    const label = t(key);
    return label === key ? stage : label;
  };

  const renderBody = () => {
    if (view.kind === "checking") {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("selfUpdate.checking")}
        </div>
      );
    }

    if (view.kind === "error") {
      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
            <span className="break-all">{view.message}</span>
          </div>
          <div>
            <Button variant="outline" size="sm" onClick={check}>
              <RefreshCw className="h-4 w-4 mr-1" />
              {t("selfUpdate.recheck")}
            </Button>
          </div>
        </div>
      );
    }

    if (view.kind === "running") {
      const task = view.task;
      const isDone = ["succeeded", "rolled_back"].includes(task.stage);
      const isBad = ["failed", "unknown"].includes(task.stage);

      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm">
            {isDone ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : isBad ? (
              <AlertCircle className="h-4 w-4 text-destructive" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            <span>
              {task.kind === "rollback"
                ? t("selfUpdate.rollbackRunning")
                : t("selfUpdate.updating")}
              {" · "}
              {stageLabel(task.stage)}
            </span>
          </div>

          {task.stage === "downloading" && task.total > 0 && (
            <div className="flex flex-col gap-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent-1">
                <div
                  className="h-full bg-foreground/60 transition-all"
                  style={{ width: `${Math.round(task.progress * 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {formatBytes(task.downloaded)} / {formatBytes(task.total)}
              </span>
            </div>
          )}

          {isDone && (
            <div className="text-sm text-muted-foreground">
              {task.kind === "rollback"
                ? t("selfUpdate.rollbackDone")
                : t("selfUpdate.updateDone", { version: task.to_version })}
            </div>
          )}

          {isBad && (
            <div className="flex flex-col gap-2">
              <span className="text-sm break-all">{task.error}</span>
              {task.stage === "unknown" && (
                <span className="text-xs text-muted-foreground">
                  {t("selfUpdate.statusUnknownHint")}
                </span>
              )}
            </div>
          )}

          {isDone && (
            <div>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-1" />
                {t("selfUpdate.reload")}
              </Button>
            </div>
          )}
        </div>
      );
    }

    if (view.kind === "result") {
      const info = view.info;
      if (!info) return null;

      if (!info.update_available) {
        return (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              {t("selfUpdate.upToDate")}
            </div>
            {info.has_backup && (
              <div>
                <Button variant="outline" size="sm" onClick={rollback}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  {t("selfUpdate.rollback")}
                </Button>
              </div>
            )}
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-mono">{info.current}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-mono font-semibold">{info.latest}</span>
            <span className="text-xs text-muted-foreground">
              ({formatBytes(info.asset.size)})
            </span>
          </div>

          {!info.can_update && info.blocked_reason && (
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
              <span>{info.blocked_reason}</span>
            </div>
          )}

          {info.release_notes && (
            <div className="km-selfupdate-notes max-h-64 overflow-y-auto rounded-md border border-muted/20 p-3 text-sm">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                // release notes 是外部输入。react-markdown 默认不渲染 raw HTML，
                // 这里再把链接协议收紧到 https，避免 javascript: 之类的伪协议。
                urlTransform={(url) =>
                  url.startsWith("https://") ? url : ""
                }
              >
                {info.release_notes}
              </ReactMarkdown>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" disabled={!info.can_update} onClick={() => start(info)}>
              <Download className="h-4 w-4 mr-1" />
              {t("selfUpdate.apply")}
            </Button>
            <a
              href={`https://github.com/aomtest/komari-slim-server/releases/tag/${info.tag}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline" size="sm">
                {t("selfUpdate.viewRelease")}
              </Button>
            </a>
            {info.has_backup && (
              <Button variant="outline" size="sm" onClick={rollback}>
                <RotateCcw className="h-4 w-4 mr-1" />
                {t("selfUpdate.rollback")}
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">{t("selfUpdate.warning")}</p>
        </div>
      );
    }

    return null;
  };

  const isBusy = view.kind === "checking" || view.kind === "running";

  return (
    <SettingCardCollapse
      title={t("selfUpdate.title")}
      description={
        currentVersion
          ? t("selfUpdate.currentVersion", { version: currentVersion })
          : t("selfUpdate.description")
      }
      defaultOpen={view.kind !== "idle"}
    >
      <div className="flex flex-col gap-4">
        <div>
          <Button variant="outline" size="sm" disabled={isBusy} onClick={check}>
            {view.kind === "checking" ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            {t("selfUpdate.check")}
          </Button>
        </div>
        {renderBody()}
      </div>
    </SettingCardCollapse>
  );
}
