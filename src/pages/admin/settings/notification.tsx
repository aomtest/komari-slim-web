import { useTranslation } from "react-i18next";
import { Text } from "@radix-ui/themes";
import { updateSettingsWithToast, useSettings } from "@/lib/api";
import {
  SettingCardButton,
  SettingCardSelect,
  SettingCardSwitch,
} from "@/components/admin/SettingCard";
import { SettingCardMultiInputCollapse } from "@/components/admin/SettingCardMultiInput";
import { toast } from "sonner";
import Loading from "@/components/loading";

const NotificationSettings = () => {
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
      <label className="text-xl font-bold">
        {t("settings.notification.title")}
      </label>
      <SettingCardSwitch
        title={t("settings.notification.enable")}
        description={t("settings.notification.enable_description")}
        defaultChecked={settings.notification_enabled}
        onChange={async (checked) => {
          await updateSettingsWithToast({ notification_enabled: checked }, t);
        }}
      />
      <SettingCardSelect
        title={t("settings.notification.method")}
        description={t("settings.notification.method_description")}
        defaultValue={settings.notification_method}
        options={[
          { value: "telegram", label: "Telegram" },
          { value: "none", label: t("common.none") },
        ]}
        OnSave={async (value) => {
          await updateSettingsWithToast({ notification_method: value }, t);
        }}
      />
      <SettingCardMultiInputCollapse
        title={t("settings.notification.telegram_title")}
        description={t("settings.notification.telegram_description")}
        defaultOpen={true}
        items={[
          {
            tag: "telegram_endpoint",
            label: t("settings.notification.telegram_endpoint"),
            type: "short",
            placeholder: "https://api.telegram.org/bot",
            defaultValue: settings.telegram_endpoint || "",
          },
          {
            tag: "telegram_bot_token",
            label: t("settings.notification.telegram_bot_token"),
            type: "short",
            placeholder: "1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            defaultValue: settings.telegram_bot_token || "",
          },
          {
            tag: "telegram_chat_id",
            label: "Chat ID",
            type: "short",
            placeholder: "1234567890",
            defaultValue: settings.telegram_chat_id || "",
          },
        ]}
        onSave={async (values) => {
          if (/^-?\d+$/.test(values.telegram_chat_id) === false) {
            toast.error(
              t(
                "settings.notification.telegram_chat_id_error",
                "Chat ID must be a number"
              )
            );
            return;
          }
          await updateSettingsWithToast(
            {
              telegram_bot_token: values.telegram_bot_token,
              telegram_chat_id: values.telegram_chat_id,
              telegram_endpoint: values.telegram_endpoint,
            },
            t
          );
        }}
      />
      <SettingCardButton
        title={t("settings.notification.test_title")}
        description={t("settings.notification.test_description")}
        onClick={async () => {
          try {
            const res = await fetch("/api/admin/test/sendMessage", {
              method: "POST",
            });
            let data;
            try {
              data = await res.json();
            } catch {
              toast.error(t("common.error"));
              return;
            }
            if (data && data.message && data.code !== 200) {
              toast.error(data.message);
              return;
            }
            toast.success(t("common.success"));
          } catch (error) {
            toast.error(
              t("common.error") +
                ": " +
                (error instanceof Error ? error.message : String(error))
            );
          }
        }}
      >
        GO
      </SettingCardButton>
    </>
  );
};

export default NotificationSettings;
