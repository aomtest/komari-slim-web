import Loading from "@/components/loading";
import { SettingCard, SettingCardLabel } from "@/components/admin/SettingCard";
import { useSettings } from "@/lib/api";
import {
  CLOUDFLARED_STOP_CONFIRM_TEXT,
  getCloudflaredStatus,
  removeCloudflaredToken,
  startCloudflared,
  stopCloudflared,
  type CloudflaredStatus,
} from "@/lib/cloudflared";
import {
  Badge,
  Button,
  Dialog,
  Flex,
  IconButton,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { Eye, EyeOff, Play, RefreshCw, Square } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const emptyStatus: CloudflaredStatus = {
  installed: false,
  running: false,
  message: "",
  errorMessage: "",
  logs: [],
  tokenStored: false,
  envTokenPresent: false,
};

export default function ReverseProxySettings() {
  const { t } = useTranslation();
  const { settings, loading: settingsLoading, error: settingsError } =
    useSettings();
  const [status, setStatus] = React.useState<CloudflaredStatus>(emptyStatus);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [token, setToken] = React.useState("");
  const [showToken, setShowToken] = React.useState(false);
  const [stopDialogOpen, setStopDialogOpen] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [confirmText, setConfirmText] = React.useState("");

  const refreshStatus = React.useCallback(async (silent = false) => {
    if (!silent) {
      setRefreshing(true);
    }
    try {
      const nextStatus = await getCloudflaredStatus();
      setStatus({
        ...nextStatus,
        logs: Array.isArray(nextStatus.logs) ? nextStatus.logs : [],
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t(
              "settings.reverse_proxy.fetch_status_failed",
              "Failed to fetch cloudflared status"
            );
      if (!silent) {
        toast.error(message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    void refreshStatus();
    const timer = window.setInterval(() => {
      void refreshStatus(true);
    }, 5000);
    return () => {
      window.clearInterval(timer);
    };
  }, [refreshStatus]);

  const withSubmit = async (
    task: () => Promise<CloudflaredStatus>,
    successMessage: string
  ) => {
    setSubmitting(true);
    try {
      const nextStatus = await task();
      setStatus({
        ...nextStatus,
        logs: Array.isArray(nextStatus.logs) ? nextStatus.logs : [],
      });
      setToken("");
      setShowToken(false);
      toast.success(successMessage);
      return nextStatus;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("settings.settings_save_failed");
      toast.error(message);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  if (settingsLoading || loading) {
    return <Loading />;
  }

  if (settingsError) {
    return <Text color="red">{settingsError}</Text>;
  }

  const disablePasswordDoubleCheck = Boolean(settings.disable_password_login);
  const canStart =
    status.installed && (status.tokenStored || token.trim().length > 0);
  const stopConfirmSatisfied = disablePasswordDoubleCheck
    ? confirmText.trim() === CLOUDFLARED_STOP_CONFIRM_TEXT
    : currentPassword.trim().length > 0;

  return (
    <Flex direction="column" gap="4">
      <SettingCardLabel>
        {t("settings.reverse_proxy.title", "Reverse Proxy")}
      </SettingCardLabel>

      <SettingCard
        title={t(
          "settings.reverse_proxy.cloudflare_title",
          "Cloudflare Tunnel"
        )}
        description={t(
          "settings.reverse_proxy.cloudflare_description",
          "Start and manage cloudflared directly from the Komari settings panel."
        )}
        direction="column"
      >
        <Flex direction="column" gap="3" className="w-full pt-3">
          <Flex gap="3" wrap="wrap">
            <StatusLine
              label={t(
                "settings.reverse_proxy.cloudflared_label",
                "cloudflared"
              )}
              ok={status.installed}
              okText={t(
                "settings.reverse_proxy.installed",
                "installed"
              )}
              failText={t(
                "settings.reverse_proxy.not_installed",
                "not installed"
              )}
            />
            <StatusLine
              label={t("settings.reverse_proxy.status_label", "status")}
              ok={status.running}
              okText={t("settings.reverse_proxy.running", "running")}
              failText={t("settings.reverse_proxy.stopped", "stopped")}
            />
            {status.pid ? (
              <Badge variant="soft" color="gray">
                PID: {status.pid}
              </Badge>
            ) : null}
          </Flex>

          {status.binaryPath ? (
            <Text size="2" color="gray">
              {t("settings.reverse_proxy.binary_label", "Binary")}:{" "}
              <code>{status.binaryPath}</code>
            </Text>
          ) : null}

          {status.envTokenPresent ? (
            <Text size="2" color="gray">
              {t(
                "settings.reverse_proxy.env_token_hint",
                "Environment variable `KOMARI_CLOUDFLARED_TOKEN` is present. Komari will try to restore cloudflared automatically on restart."
              )}
            </Text>
          ) : null}

          <div>
            <label
              className="mb-2 block text-sm font-medium"
              htmlFor="cloudflareTunnelToken"
            >
              {t(
                "settings.reverse_proxy.cloudflare_token",
                "Cloudflare Tunnel Token"
              )}
            </label>
            <TextField.Root
              id="cloudflareTunnelToken"
              type={showToken ? "text" : "password"}
              value={token}
              placeholder={
                status.tokenStored
                  ? t(
                      "settings.reverse_proxy.cloudflare_token_stored_placeholder",
                      "•••••••••••••••• (stored securely, not returned to the browser)"
                    )
                  : t(
                      "settings.reverse_proxy.cloudflare_token_placeholder",
                      "Paste your Cloudflare Tunnel token"
                    )
              }
              onChange={(event) => {
                setToken(event.target.value);
              }}
              autoComplete="new-password"
              disabled={status.running}
            >
              <TextField.Slot side="right">
                <IconButton
                  type="button"
                  variant="ghost"
                  onClick={() => setShowToken((prev) => !prev)}
                >
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </IconButton>
              </TextField.Slot>
            </TextField.Root>
            <Text size="2" color="gray" className="mt-2 block">
              {t(
                "settings.reverse_proxy.cloudflare_token_help",
                "The saved token is encrypted on the server side. The frontend only receives whether a token is stored, never the raw token."
              )}
            </Text>
            {status.tokenStored && !status.running ? (
              <Text size="2" color="gray" className="mt-1 block">
                <button
                  type="button"
                  className="cursor-pointer underline"
                  onClick={() =>
                    void withSubmit(
                      () => removeCloudflaredToken(),
                      t(
                        "settings.reverse_proxy.remove_token_success",
                        "Cloudflare Tunnel token removed"
                      )
                    )
                  }
                >
                  {t(
                    "settings.reverse_proxy.remove_token",
                    "Remove the stored token"
                  )}
                </button>
              </Text>
            ) : null}
            <Text size="2" color="gray" className="mt-1 block">
              {t(
                "settings.reverse_proxy.guide_prefix",
                "Need help finding the token? Read the Uptime Kuma guide:"
              )}{" "}
              <a
                href="https://github.com/louislam/uptime-kuma/wiki/Reverse-Proxy-with-Cloudflare-Tunnel"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://github.com/louislam/uptime-kuma/wiki/Reverse-Proxy-with-Cloudflare-Tunnel
              </a>
            </Text>
          </div>

          <Flex gap="2" wrap="wrap">
            {!status.running ? (
              <Button
                disabled={submitting || !canStart}
                onClick={() =>
                  void withSubmit(
                    () => startCloudflared(token.trim()),
                    t(
                      "settings.reverse_proxy.start_success",
                      "cloudflared started"
                    )
                  )
                }
              >
                <Play size={16} />
                {t(
                  "settings.reverse_proxy.start_cloudflared",
                  "Start cloudflared"
                )}
              </Button>
            ) : (
              <Button
                color="red"
                disabled={submitting}
                onClick={() => setStopDialogOpen(true)}
              >
                <Square size={16} />
                {t(
                  "settings.reverse_proxy.stop_cloudflared",
                  "Stop cloudflared"
                )}
              </Button>
            )}

            <Button
              variant="ghost"
              disabled={refreshing}
              onClick={() => void refreshStatus()}
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              {t("common.refresh", "Refresh")}
            </Button>
          </Flex>

          {status.message ? (
            <Text size="2" color="gray">
              {t("settings.reverse_proxy.latest_status", "Latest status")}:{" "}
              {status.message}
            </Text>
          ) : null}

          {status.errorMessage ? (
            <div>
              <label className="mb-2 block text-sm font-medium">
                {t(
                  "settings.reverse_proxy.error_message",
                  "Error message"
                )}
              </label>
              <TextArea value={status.errorMessage} readOnly rows={4} />
            </div>
          ) : null}

          {status.logs.length > 0 ? (
            <div>
              <label className="mb-2 block text-sm font-medium">
                {t("settings.reverse_proxy.recent_logs", "Recent logs")}
              </label>
              <TextArea value={status.logs.join("\n")} readOnly rows={10} />
            </div>
          ) : null}

          {!status.installed ? (
            <Text size="2" color="gray">
              {t(
                "settings.reverse_proxy.install_hint",
                "In non-Docker deployments, install cloudflared manually or set `KOMARI_CLOUDFLARED_BIN` to the cloudflared binary path."
              )}
            </Text>
          ) : null}
        </Flex>
      </SettingCard>

      <Dialog.Root
        open={stopDialogOpen}
        onOpenChange={(open) => {
          setStopDialogOpen(open);
          if (!open) {
            setCurrentPassword("");
            setConfirmText("");
          }
        }}
      >
        <Dialog.Content maxWidth="520px">
          <Dialog.Title>
            {t(
              "settings.reverse_proxy.stop_dialog_title",
              "Stop cloudflared"
            )}
          </Dialog.Title>
          <Dialog.Description>
            {t(
              "settings.reverse_proxy.stop_dialog_description",
              "If you are currently accessing Komari through this tunnel, stopping cloudflared may immediately disconnect your session."
            )}
          </Dialog.Description>

          {!disablePasswordDoubleCheck ? (
            <Flex direction="column" gap="2" className="mt-4">
              <label
                className="text-sm font-medium"
                htmlFor="cloudflaredCurrentPassword"
              >
                {t(
                  "settings.reverse_proxy.current_password",
                  "Current password"
                )}
              </label>
              <TextField.Root
                id="cloudflaredCurrentPassword"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </Flex>
          ) : (
            <Flex direction="column" gap="2" className="mt-4">
              <label
                className="text-sm font-medium"
                htmlFor="cloudflaredStopConfirmText"
              >
                {t(
                  "settings.reverse_proxy.confirmation_text",
                  "Confirmation text"
                )}
              </label>
              <Text size="2" color="gray">
                {t(
                  "settings.reverse_proxy.confirmation_help",
                  "Password login is disabled. Type `STOP CLOUDFLARED` to confirm."
                )}
              </Text>
              <TextField.Root
                id="cloudflaredStopConfirmText"
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                autoComplete="off"
              />
            </Flex>
          )}

          <Flex justify="end" gap="2" className="mt-6">
            <Dialog.Close>
              <Button variant="soft">{t("cancel", "Cancel")}</Button>
            </Dialog.Close>
            <Button
              color="red"
              disabled={submitting || !stopConfirmSatisfied}
              onClick={async () => {
                await withSubmit(
                  () => stopCloudflared(currentPassword, confirmText),
                  t(
                    "settings.reverse_proxy.stop_success",
                    "cloudflared stopped"
                  )
                );
                setCurrentPassword("");
                setConfirmText("");
                setStopDialogOpen(false);
              }}
            >
              {t(
                "settings.reverse_proxy.stop_cloudflared",
                "Stop cloudflared"
              )}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Flex>
  );
}

function StatusLine({
  label,
  ok,
  okText,
  failText,
}: {
  label: string;
  ok: boolean;
  okText: string;
  failText: string;
}) {
  return (
    <Badge variant="soft" color={ok ? "green" : "gray"}>
      {label}: {ok ? okText : failText}
    </Badge>
  );
}
