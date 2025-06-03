import { useTranslation } from "react-i18next";
import { Text } from "@radix-ui/themes";
import {
  updateSettingsWithToast,
  useSettings
} from "@/lib/api";
import {
  SettingCardLongTextInput,
  SettingCardShortTextInput,
  SettingCardSwitch,
} from "@/components/admin/SettingCard";

export default function SiteSettings() {
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
      <SettingCardShortTextInput
        title={t("settings.site.name")}
        description={t("settings.site.name_description")}
        defaultValue={settings.sitename || ""}
        OnSave={async (data) => {
          await updateSettingsWithToast({ sitename: data },t);
        }}
      />
      <SettingCardLongTextInput
        title={t("settings.site.description")}
        description={t("settings.site.description_description")}
        defaultValue={settings.description || ""}
        OnSave={async (data) => {
          await updateSettingsWithToast({ description: data },t);
        }}
      />
      <SettingCardSwitch
        title={t("settings.site.cros")}
        description={t("settings.site.cros_description")}
        defaultChecked={settings.allow_cros}
        onChange={async (checked) => {
          await updateSettingsWithToast({ allow_cros: checked },t);
        }}
      />
    </>
  );
}
