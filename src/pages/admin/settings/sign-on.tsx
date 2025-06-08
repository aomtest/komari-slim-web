import {
  SettingCardCollapse,
  SettingCardLabel,
  SettingCardSwitch,
} from "@/components/admin/SettingCard";
import { updateSettingsWithToast, useSettings } from "@/lib/api";
import { Button, Flex, Text, TextField } from "@radix-ui/themes";
import React from "react";
import { useTranslation } from "react-i18next";

export default function SignOnSettings() {
  const { t } = useTranslation();
  const { settings, loading, error } = useSettings();
  const sso_id_input = React.useRef<HTMLInputElement>(null);
  const sso_secret_input = React.useRef<HTMLInputElement>(null);
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
      <SettingCardCollapse
        title={
          t("settings.sso.client_id") + " & " + t("settings.sso.client_secret")
        }
        description={t("settings.sso.client_id_description")}
        defaultOpen={true}
      >
        <Flex direction="column" gap="2" className="w-full">
          <label className="text-sm font-semibold">
            {t("settings.sso.client_id")}
          </label>
          <TextField.Root
            ref={sso_id_input}
            defaultValue={settings.o_auth_client_id}
          ></TextField.Root>
          <label className="text-sm font-semibold">
            {t("settings.sso.client_secret")}
          </label>
          <TextField.Root
            ref={sso_secret_input}
            defaultValue={settings.o_auth_client_secret}
          ></TextField.Root>
          <div>
            <Button
              variant="solid"
              className="mt-2"
              onClick={async (e) => {
                const b = e.target as HTMLButtonElement;
                b.disabled = true;
                const id = sso_id_input.current?.value;
                const secret = sso_secret_input.current?.value;
                await updateSettingsWithToast(
                  { o_auth_client_id: id, o_auth_client_secret: secret },
                  t
                );
                b.disabled = false;
              }}
            >
              {t("save")}
            </Button>
          </div>
        </Flex>
      </SettingCardCollapse>
    </>
  );
}

