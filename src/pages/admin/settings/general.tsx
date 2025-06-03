import { useTranslation } from "react-i18next";
import { Badge, Flex, IconButton, Text, TextField } from "@radix-ui/themes";
import { updateSettingsWithToast, useSettings } from "@/lib/api";
import {
  SettingCard,
  SettingCardSelect,
  SettingCardSwitch,
} from "@/components/admin/SettingCard";
import { Search } from "lucide-react";
export default function GeneralSettings() {
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
      <label className="text-xl font-bold">{t("settings.geoip.title")}</label>
      <SettingCardSwitch
        title={t("settings.geoip.enable_title")}
        description={t("settings.geoip.enable_description")}
        defaultChecked={settings.geo_ip_enabled}
        onChange={async (checked) => {
          await updateSettingsWithToast({ geo_ip_enabled: checked }, t);
        }}
      />
      <SettingCardSelect
        title={t("settings.geoip.provider_title")}
        description={t("settings.geoip.provider_description")}
        defaultValue={settings.geo_ip_provider}
        options={[
          { value: "mmbd" },
          { value: "ip-api.com", disabled: true },
          { value: "ipinfo.io", disabled: true },
        ]}
        OnSave={async (value) => {
          await updateSettingsWithToast({ geo_ip_provider: value }, t);
        }}
      />
      <SettingCard
        title={t("settings.geoip.test_title")}
        description={t("settings.geoip.test_description")}
      >
        <Flex className="w-full gap-2">
          <TextField.Root className="flex-2/3" placeholder="1.1.1.1 or 2606:4700:4700::1111"></TextField.Root>
          <IconButton variant="soft"><Search /></IconButton>
        </Flex>
        <Text className="self-start">Region <Badge>United States</Badge></Text>
        <Text className="self-start">ISO Code <Badge>US</Badge></Text>
        <Text className="self-start">{"(Not Implemented)"}</Text>
      </SettingCard>
    </>
  );
}
