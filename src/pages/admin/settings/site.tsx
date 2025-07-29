import { useTranslation } from "react-i18next";
import { Button, Dialog, Flex, Text } from "@radix-ui/themes";
import { updateSettingsWithToast, useSettings } from "@/lib/api";
import {
  SettingCardButton,
  SettingCardCollapse,
  SettingCardIconButton,
  SettingCardLabel,
  SettingCardLongTextInput,
  SettingCardShortTextInput,
  SettingCardSwitch,
} from "@/components/admin/SettingCard";
import { toast } from "sonner";
import Loading from "@/components/loading";
import { DownloadIcon } from "lucide-react";

export default function SiteSettings() {
  const { t } = useTranslation();
  const { settings, loading, error } = useSettings();

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
        title={t("settings.site.cros")}
        description={t("settings.site.cros_description")}
        defaultChecked={settings.allow_cors}
        onChange={async (checked) => {
          await updateSettingsWithToast({ allow_cors: checked }, t);
        }}
      />
      <SettingCardSwitch
        title={t("settings.site.private_site")}
        description={t("settings.site.private_site_description")}
        defaultChecked={settings.private_site}
        onChange={async (checked) => {
          await updateSettingsWithToast({ private_site: checked }, t);
        }}
      />
      <SettingCardLabel>{t("settings.site.custom")}</SettingCardLabel>
      <label className="text-sm text-muted-foreground -mt-4">
        {t("settings.custom.note", "个性化内容在使用自定义主题时可能会被覆盖。请确保代码的安全性，避免使用不受信任的内容。")}
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
          "在页面底部添加自定义内容"
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
          "在浏览器标签页显示的图标"
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
              src="/favicon.ico"
              alt="Favicon"
              style={{ width: 32, height: 32 }}
            />
          </Flex>
          <label className="text-sm text-muted-foreground">
            {t("settings.custom.favicon_note", "Favicon 图标的更新速度可能较慢，通常需要清除浏览器缓存后才能看到更改。")}
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
                    "这将恢复默认的 Favicon 图标，是否继续？"
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
                              toast.success(
                                t(
                                  "settings.custom.favicon_default_success",
                                  "已恢复默认 Favicon"
                                )
                              );
                            } else {
                              toast.error(
                                data.message || "恢复默认 Favicon 失败"
                              );
                            }
                          })
                          .catch((error) => {
                            toast.error("" + error);
                          });
                      }}
                    >
                      {t("settings.custom.favicon_confirm", "确认")}
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
                        }
                      );
                      const data = await response.json();
                      if (data.status === "success") {
                        toast.success(
                          t(
                            "settings.custom.favicon_update_success",
                            "已更新 Favicon"
                          )
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
              {t("settings.custom.favicon_change", "更新 Favicon")}
            </Button>
          </Flex>
        </Flex>
      </SettingCardCollapse>
      <SettingCardLabel>
        {t("settings.site.backup")}
      </SettingCardLabel>
      <SettingCardIconButton
        title={t("settings.site.backup_download")}
        description={t("settings.site.backup_download_description")}
        onClick={() => {
          window.open("/api/admin/download/backup", "_blank");
        }}
      >
        <DownloadIcon size={16} />
      </SettingCardIconButton>
      <SettingCardButton
        title={t("settings.site.backup_restore")}
        description={t("settings.site.backup_restore_description")}
        onClick={async () => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.zip';
          input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('backup', file);

            try {
              const response = await fetch('/api/admin/upload/backup', {
                method: 'POST',
                body: formData
              });

                if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                const errorMsg = data.message
                  ? `${data.message}`
                  : t('settings.site.backup_restore_error');
                throw new Error(errorMsg);
                }

              toast.success(t('account_settings.upload_success'));
            } catch (error) {
              toast.error((error as Error).message);
            }
          };
          input.click();
        }}
      >
        {t("common.select")}
      </SettingCardButton>
    </>
  );
}
