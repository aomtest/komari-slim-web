import { useTranslation } from "react-i18next";
import { Text } from "@radix-ui/themes";
import { updateSettingsWithToast, useSettings } from "@/lib/api";
import {
  SettingCardButton,
  SettingCardLabel,
  SettingCardSelect,
  SettingCardShortTextInput,
  SettingCardSwitch,
} from "@/components/admin/SettingCard";
import { toast } from "sonner";
import Loading from "@/components/loading";
import React from "react";
import { renderProviderInputs } from "@/utils/renderProviders";

const NotificationSettings = () => {
  const { t } = useTranslation();
  const { settings, loading, error } = useSettings();
  const [messageDefs, setMessageDefs] = React.useState<any>({});
  const [messageList, setMessageList] = React.useState<string[]>([]);
  const [currentMessageSender, setCurrentMessageSender] = React.useState<string>("");
  const [messageValues, setMessageValues] = React.useState<any>({});
  const [messageLoading, setMessageLoading] = React.useState(false);
  const [messageError, setMessageError] = React.useState("");

  // 拉取所有 message sender 及字段定义
  React.useEffect(() => {
    if (loading) return;
    setMessageLoading(true);
    fetch("/api/admin/settings/message-sender")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success" && data.data) {
          setMessageDefs(data.data);
          const senders = Object.keys(data.data);
          setMessageList(senders);
          const initialSender =
            settings.notification_method && senders.includes(settings.notification_method)
              ? settings.notification_method
              : "";
          setCurrentMessageSender(initialSender);
        } else {
          setMessageError(data.message || "获取消息通道信息失败");
        }
      })
      .catch(() => setMessageError("获取消息通道信息失败"))
      .finally(() => setMessageLoading(false));
  }, [loading, settings.notification_method]);

  // 拉取当前 message sender 的设置
  React.useEffect(() => {
    if (!currentMessageSender) return;
    setMessageLoading(true);
    fetch(`/api/admin/settings/message-sender?provider=${currentMessageSender}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success" && data.data) {
          try {
            setMessageValues(JSON.parse(data.data.addition || "{}"));
          } catch {
            setMessageValues({});
          }
        } else {
          setMessageError(data.message || "获取设置失败");
        }
      })
      .catch(() => setMessageError("获取设置失败"))
      .finally(() => setMessageLoading(false));
  }, [currentMessageSender]);

  // 处理保存
  const handleMessageSave = async (values: any) => {
    setMessageLoading(true);
    setMessageError("");
    const body = {
      name: currentMessageSender,
      addition: JSON.stringify(values),
    };
    try {
      const res = await fetch("/api/admin/settings/message-sender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.status !== "success") {
        throw new Error(data.message || t("common.error"));
      } else {
        setMessageValues(values);
      }
      toast.success(t("common.success"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
    setMessageLoading(false);
  };
  if (loading || (!messageLoading && messageList.length === 0 && !messageError)) {
    return <Loading />;
  }
  if (error) {
    return <Text color="red">{error}</Text>;
  }
  if (messageError) {
    return <Text color="red">{messageError}</Text>;
  }

  return (
    <>
      <SettingCardLabel>{t("settings.notification.title")}</SettingCardLabel>
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
        options={messageList.map((sender) => ({ value: sender, label: sender }))}
        value={currentMessageSender}
        OnSave={async (val: string) => {
          if (val === currentMessageSender) return;
          await updateSettingsWithToast({ notification_method: val }, t);
          setCurrentMessageSender(val);
        }}
      />
      {messageLoading ? <Loading/> : renderProviderInputs({
        currentProvider: currentMessageSender,
        providerDefs: messageDefs,
        providerValues: messageValues,
        translationPrefix: "settings.notification",
        setProviderValues: setMessageValues,
        handleSave: handleMessageSave,
        t,
      })}
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
      <SettingCardLabel>{t("admin.notification.expire_title")}</SettingCardLabel>
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
