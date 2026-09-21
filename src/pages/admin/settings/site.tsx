import { useTranslation } from "react-i18next";
import { Button, Dialog, Flex, Text } from "@radix-ui/themes";
import { updateSettingsWithToast, useSettings } from "@/lib/api";
import {
  SettingCardCollapse,
  SettingCardLabel,
  SettingCardLongTextInput,
  SettingCardShortTextInput,
  SettingCardSwitch,
} from "@/components/admin/SettingCard";
import { toast } from "sonner";
import Loading from "@/components/loading";
import { useState } from "react";

export default function SiteSettings() {
  const { t } = useTranslation();
  const { settings, loading, error, refetch } = useSettings();
  const [shareHours, setShareHours] = useState(1);
  // 预览 favicon 用的缓存破坏参数。
  // 浏览器对 /favicon.ico 的缓存极其激进，且服务端的 favicon handler 没有设置
  // Cache-Control，所以一旦浏览器缓存过一次 404（例如安装完成前访问过）或旧图标，
  // 「当前 Favicon」预览就会长期显示破图/旧图。加个随每次进入页面变化的参数可绕开它；
  // 上传/恢复默认后再更新一次，让预览立刻反映新状态。
  const [faviconBust, setFaviconBust] = useState(() => Date.now());

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Text color="red">{error}</Text>;
  }

  return (
    <>
      <SettingCardLabel>{t("settings.site.title")}</SettingCardLabel>
      <SettingCardShortTextInput
        title={t("settings.site.name")}
        description={t("settings.site.name_description")}
        defaultValue={settings.sitename || ""}
        OnSave={async (data) => {
          await updateSettingsWithToast({ sitename: data }, t);
        }}
      />
      <SettingCardLongTextInput
        title={t("settings.site.description")}
        description={t("settings.site.description_description")}
        defaultValue={settings.description || ""}
        OnSave={async (data) => {
          await updateSettingsWithToast({ description: data }, t);
        }}
      />
      <SettingCardSwitch
        title={t("settings.site.cors_origin_check_enabled")}
        description={t("settings.site.cors_origin_check_enabled_description")}
        defaultChecked={settings.cors_origin_check_enabled ?? true}
        onChange={async (checked) => {
          await updateSettingsWithToast({ cors_origin_check_enabled: checked }, t);
        }}
        className="km-page-admin-settings-site km-setting-card"
      />
      <SettingCardLongTextInput
        title={t("settings.site.cors_allowed_origins", "API CORS 允许列表")}
        description={t("settings.site.origins_list_description",
          "每行或用逗号分隔一个 Origin，例如 https://example.com",
        )}
        defaultValue={settings.cors_allowed_origins || ""}
        OnSave={async (data) => {
          await updateSettingsWithToast({ cors_allowed_origins: data }, t);
        }}
      />
      <SettingCardSwitch
        title={t("settings.site.ws_origin_check_enabled", "WebSocket Origin 校验")}
        description={t(
          "settings.site.ws_origin_check_enabled_description",
          "开启后 WebSocket 请求只允许同源或允许列表中的 Origin",
        )}
        defaultChecked={settings.ws_origin_check_enabled ?? true}
        onChange={async (checked) => {
          await updateSettingsWithToast(
            { ws_origin_check_enabled: checked },
            t,
          );
        }}
        className="km-setting-card"
      />
      <SettingCardLongTextInput
        title={t("settings.site.ws_allowed_origins", "WebSocket Origin 允许列表")}
        description={t("settings.site.origins_list_description",
          "每行或用逗号分隔一个 Origin，例如 https://example.com",
        )}
        defaultValue={settings.ws_allowed_origins || ""}
        OnSave={async (data) => {
          await updateSettingsWithToast({ ws_allowed_origins: data }, t);
        }}
      />
      <SettingCardSwitch
        title={t("settings.site.ssrf_protection_enabled")}
        description={t("settings.site.ssrf_protection_enabled_description")}
        defaultChecked={settings.ssrf_protection_enabled ?? false}
        onChange={async (checked) => {
          await updateSettingsWithToast(
            { ssrf_protection_enabled: checked },
            t,
          );
        }}
        className="km-setting-card"
      />
      <SettingCardSwitch
        title={t("settings.site.send_ip_addr_to_guest")}
        description={t("settings.site.send_ip_addr_to_guest_description")}
        defaultChecked={settings.send_ip_addr_to_guest}
        onChange={async (checked) => {
          await updateSettingsWithToast({ send_ip_addr_to_guest: checked }, t);
        }}
        className="km-setting-card"
      />
      <SettingCardShortTextInput
        title={t("settings.site.script_domain")}
        description={t("settings.site.script_domain_description")}
        placeholder={`${window.location.origin}`}
        defaultValue={settings.script_domain || ""}
        OnSave={async (data) => {
          await updateSettingsWithToast({ script_domain: data }, t);
        }}
      />
      <SettingCardLabel>{t("settings.site.private_site")}</SettingCardLabel>
      <SettingCardSwitch
        title={t("settings.site.private_site")}
        description={t("settings.site.private_site_description")}
        defaultChecked={settings.private_site}
        onChange={async (checked) => {
          await updateSettingsWithToast({ private_site: checked }, t);
        }}
        className="km-setting-card"
      />
      <SettingCardCollapse
        title={t("settings.site.temporary_share")}
        description={t("settings.site.temporary_share_description")}
      >
        <div className="flex w-full flex-col gap-4">
          <SettingCardShortTextInput
            title={t("settings.site.temporary_share_current_link")}
            value={
              settings.tempory_share_token
                ? `${window.location.origin}/?temp_key=${settings.tempory_share_token}`
                : ""
            }
            showSaveButton={false}
            description={`${t("admin.nodeTable.expiredAt")}: ${new Date((settings.tempory_share_token_expire_at || 0) * 1000).toLocaleString()}`}
            disabled
            bordless
          >
            <Button
              onClick={() => {
                if (!settings.tempory_share_token) return;
                navigator.clipboard.writeText(
                  `${window.location.origin}/?temp_key=${settings.tempory_share_token}`,
                );
                toast.success(t("common.copy"));
              }}
            >
              {t("common.copy")}
            </Button>
          </SettingCardShortTextInput>
          <SettingCardShortTextInput
            title={t("settings.site.temporary_share_hours")}
            bordless
            showSaveButton={false}
            value={shareHours}
            type="number"
            onChange={(e) => {
              const val = Number.parseInt(e.target.value, 10);
              if (!Number.isNaN(val)) {
                setShareHours(val);
              }
            }}
          ></SettingCardShortTextInput>
          <div className="flex flex-row w-full gap-2">
            <Button
              onClick={async () => {
                const chars =
                  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                let key = "";
                for (let i = 0; i < 8; i++) {
                  key += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                await updateSettingsWithToast(
                  {
                    tempory_share_token: key,
                    tempory_share_token_expire_at:
                      Math.floor(Date.now() / 1000) + shareHours * 3600,
                  },
                  t,
                );
                await refetch();
              }}
            >
              {t("common.generate")}
            </Button>
            <Button
              color="red"
              variant="soft"
              onClick={async () => {
                await updateSettingsWithToast(
                  { tempory_share_token: "", tempory_share_token_expire_at: 0 },
                  t,
                );
                await refetch();
              }}
            >
              {t("settings.site.temporary_share_revoke")}
            </Button>
          </div>
        </div>
      </SettingCardCollapse>
      <SettingCardLabel>{t("settings.site.custom")}</SettingCardLabel>
      <label className="text-sm text-muted-foreground -mt-4">
        {t("settings.custom.note")}
      </label>
      <SettingCardLongTextInput
        title={t("settings.custom.header")}
        description={t("settings.custom.header_description")}
        defaultValue={settings.custom_head || ""}
        OnSave={async (data) => {
          await updateSettingsWithToast({ custom_head: data }, t);
        }}
      />
      <SettingCardLongTextInput
        title={t("settings.custom.body", "自定义 Body")}
        description={t(
          "settings.custom.body_description",
          "在页面底部添加自定义内容",
        )}
        defaultValue={settings.custom_body || ""}
        OnSave={async (data) => {
          await updateSettingsWithToast({ custom_body: data }, t);
        }}
      />
      <SettingCardCollapse
        title={t("settings.custom.favicon", "自定义 Favicon")}
        description={t(
          "settings.custom.favicon_description",
          "在浏览器标签页显示的图标",
        )}
        defaultOpen={true}
      >
        <Flex
          width={"100%"}
          justify="between"
          align="start"
          direction={"column"}
          gap="2"
        >
          <Flex gap="2" align="center">
            {t("settings.custom.favicon_current", "当前 Favicon")}
            <img
              src={`/favicon.ico?v=${faviconBust}`}
              alt="Favicon"
              style={{ width: 32, height: 32 }}
            />
          </Flex>
          <label className="text-sm text-muted-foreground">
            {t(
              "settings.custom.favicon_note",
              "Favicon 图标的更新速度可能较慢，通常需要清除浏览器缓存后才能看到更改。",
            )}
          </label>
          <Flex gap="2" align="center">
            <Dialog.Root>
              <Dialog.Trigger>
                <Button color="tomato">
                  {t("settings.custom.favicon_default", "恢复默认")}
                </Button>
              </Dialog.Trigger>
              <Dialog.Content>
                <Dialog.Title>
                  {t("settings.custom.favicon_default", "恢复默认")}
                </Dialog.Title>
                <Dialog.Description>
                  {t(
                    "settings.custom.favicon_default_description",
                    "这将恢复默认的 Favicon 图标，是否继续？",
                  )}
                </Dialog.Description>
                <Flex gap="2" justify="end">
                  <Dialog.Close>
                    <Button variant="soft">{t("common.cancel", "取消")}</Button>
                  </Dialog.Close>
                  <Dialog.Trigger>
                    <Button
                      color="red"
                      onClick={async () => {
                        fetch("/api/admin/update/favicon", {
                          method: "POST",
                        })
                          .then((response) => {
                            return response.json();
                          })
                          .then((data) => {
                            if (data.status === "success") {
                              // 恢复默认后立刻刷新预览（绕开缓存）
                              setFaviconBust(Date.now());
                              toast.success(t("settings.custom.favicon_default_success"));
                            } else {
                              toast.error(
                                data.message || t("settings.custom.favicon_default_error"),
                              );
                            }
                          })
                          .catch((error) => {
                            toast.error("" + error);
                          });
                      }}
                    >
                      {t("common.confirm")}
                    </Button>
                  </Dialog.Trigger>
                </Flex>
              </Dialog.Content>
            </Dialog.Root>
            <Button
              onClick={async () => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    try {
                      const response = await fetch(
                        "/api/admin/update/favicon",
                        {
                          method: "PUT",
                          body: file,
                          headers: {
                            "Content-Type": "application/octet-stream",
                          },
                        },
                      );
                      const data = await response.json();
                      if (data.status === "success") {
                        // 上传成功后立刻刷新预览（绕开缓存）
                        setFaviconBust(Date.now());
                        toast.success(
                          t(
                            "settings.custom.favicon_update_success"
                          ),
                        );
                      } else {
                        toast.error(data.message || "Failed to update Favicon");
                      }
                    } catch (error) {
                      toast.error("" + error);
                    }
                  }
                };
                input.click();
              }}
            >
              {t("settings.custom.favicon_change")}
            </Button>
          </Flex>
        </Flex>
      </SettingCardCollapse>
    </>
  );
}
