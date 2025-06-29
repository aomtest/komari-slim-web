import { useTranslation } from "react-i18next";
import { Text } from "@radix-ui/themes";
import { updateSettingsWithToast, useSettings } from "@/lib/api";
import {
  SettingCardButton,
  SettingCardSelect,
  SettingCardShortTextInput,
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
          { value: "none", label: t("common.none") },
          { value: "telegram", label: "Telegram" },
          { value: "email", label: t("settings.notification.email") },
        ]}
        OnSave={async (value) => {
          await updateSettingsWithToast({ notification_method: value }, t);
        }}
      />
      {/* Telegram Settings */}
      <SettingCardMultiInputCollapse
        title={t("settings.notification.telegram_title")}
        description={t("settings.notification.telegram_description")}
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
      {/* SMTP Settings */}
      <SettingCardMultiInputCollapse
        title={t("settings.notification.smtp_title")}
        description={t("settings.notification.smtp_description")}
        items={[
          {
            tag: "email_host",
            label: t("settings.notification.smtp_host"),
            type: "short",
            placeholder: "smtp.example.com",
            defaultValue: settings.email_host || "",
          },
          {
            tag: "email_port",
            label: t("settings.notification.smtp_port"),
            type: "short",
            number: true,
            placeholder: "587",
            defaultValue: settings.email_port || "",
          },
          {
            tag: "email_username",
            label: t("settings.notification.smtp_username"),
            type: "short",
            placeholder: "user@example.com",
            defaultValue: settings.email_username || "",
          },
          {
            tag: "email_password",
            label: t("settings.notification.smtp_password"),
            type: "short",
            defaultValue: settings.email_password || "",
          },
          {
            tag: "email_sender",
            label: t("settings.notification.smtp_sender"),
            type: "short",
            placeholder: "me@example.com",
            defaultValue: settings.email_sender,
          },
          {
            tag: "email_receiver",
            label: t("settings.notification.smtp_receiver"),
            type: "short",
            placeholder: "receiver@example.com",
            defaultValue: settings.email_receiver || "",
          },
        ]}
        onSave={async (values) => {
          const port = Number(values.email_port);
          if (isNaN(port) || port <= 0) {
            toast.error("Please enter a valid port number");
            return;
          }
          await updateSettingsWithToast(
            {
              email_host: values.email_host,
              email_port: port,
              email_username: values.email_username,
              email_password: values.email_password,
              email_sender: values.email_sender,
              email_receiver: values.email_receiver,
            },
            t
          );
        }}
      >
        <SettingCardSwitch
          title={t("settings.notification.smtp_ssl")}
          bordless
          defaultChecked={settings.email_use_ssl}
          onChange={async (checked) => {
            await updateSettingsWithToast({ email_use_ssl: checked }, t);
          }}
        />
      </SettingCardMultiInputCollapse>
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
      <label className="text-xl font-bold">
        {t("admin.notification.expire_title")}
      </label>
      <SettingCardSwitch
        defaultChecked={settings.expire_notification_enabled}
        title={t("admin.notification.expire_enable")}
        description={t("admin.notification.expire_enable_description")}
        onChange={async (checked) => {
          await updateSettingsWithToast(
            { expire_notification_enabled: checked },
            t
          );
        }}
      />
      <SettingCardShortTextInput
        number
        title={t("admin.notification.expire_time")}
        description={t("admin.notification.expire_time_description")}
        defaultValue={settings.expire_notification_lead_days}
        OnSave={async (value) => {
          const numValue = Number(value);
          if (isNaN(numValue) || numValue < 0) {
            toast.error("Please enter a valid non-negative number");
            return;
          }
          await updateSettingsWithToast(
            { expire_notification_lead_days: numValue },
            t
          );
        }}
      />
    </>
  );
};

export default NotificationSettings;
