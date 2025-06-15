import {
  SettingCardLabel,
  SettingCardSelect,
  SettingCardSwitch,
} from "@/components/admin/SettingCard";
import { updateSettingsWithToast, useSettings } from "@/lib/api";
import { Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { SettingCardMultiInputCollapse } from "@/components/admin/SettingCardMultiInput";

export default function SignOnSettings() {
  const { t } = useTranslation();
  const { settings, loading, error } = useSettings();
  if (loading) {
    return <Text>{t("sessions.loading")}</Text>;
  }
  if (error) {
    return <Text color="red">{error}</Text>;
  }
  return (
    <>
      <SettingCardLabel>{t("settings.sign_on.title")}</SettingCardLabel>
      <SettingCardSwitch
        title={t("settings.sign_on.disable_password", "禁止密码登录")}
        defaultChecked={settings.disable_password_login}
        onChange={async (checked) => {
          await updateSettingsWithToast({ disable_password_login: checked }, t);
        }}
      />
      <SettingCardLabel>{t("settings.sso.title")}</SettingCardLabel>
      <SettingCardSwitch
        title={t("settings.sso.enable", "启用单点登录")}
        defaultChecked={settings.o_auth_enabled}
        description={t("settings.sso.enable_description", "启用单点登录功能")}
        onChange={async (checked) => {
          await updateSettingsWithToast({ o_auth_enabled: checked }, t);
        }}
      />
      <SettingCardSelect
        title={t("settings.sso.provider")}
        description={t("settings.sso.provider_description")}
        options={[{ value: "github", label: "GitHub" }]}
        defaultValue="github"
      />
      <SettingCardMultiInputCollapse
        title={
          t("settings.sso.client_id") + " & " + t("settings.sso.client_secret")
        }
        description={t("settings.sso.client_id_description")}
        defaultOpen={true}
        items={[
          {
            tag: "o_auth_client_id",
            label: t("settings.sso.client_id"),
            type: "short",
            defaultValue: settings.o_auth_client_id,
          },
          {
            tag: "o_auth_client_secret",
            label: t("settings.sso.client_secret"),
            type: "short",
            defaultValue: settings.o_auth_client_secret,
          },
        ]}
        onSave={async (values) => {
          await updateSettingsWithToast(
            {
              o_auth_client_id: values.o_auth_client_id,
              o_auth_client_secret: values.o_auth_client_secret,
            },
            t
          );
        }}
      >
        <label className="text-sm text-muted-foreground">
          {t("settings.sso.callback_url_tips", { url: window.location.origin + "/api/oauth_callback" })}
        </label>
      </SettingCardMultiInputCollapse>
    </>
  );
}
