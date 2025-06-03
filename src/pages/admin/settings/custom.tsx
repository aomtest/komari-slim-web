import { useTranslation } from "react-i18next";
import { Text } from "@radix-ui/themes";
import {
  updateSettingsWithToast,
  useSettings,
} from "@/lib/api";
import { SettingCardLongTextInput } from "@/components/admin/SettingCard";

export default function CustomSettings() {
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
      <SettingCardLongTextInput
        title={t("settings.custom.header")}
        description={t("settings.custom.header_description")}
        defaultValue={settings.custom_head || ""}
        OnSave={async (data) => {
          await updateSettingsWithToast({ custom_head: data },t);
        }}
      />
    </>
  );
}
