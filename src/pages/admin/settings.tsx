import { Pencil1Icon } from "@radix-ui/react-icons";
import {
  Button,
  Card,
  DropdownMenu,
  Flex,
  IconButton,
  Popover,
  Switch,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

// Define settings type
type SiteSettings = {
  sitename: string;
  desc: string;
  allow_cros: boolean;
  geoip_enable: boolean;
  geoip_provider: string;
  oauth_id: string;
  oauth_secret: string;
  oauth_enable: boolean;
  custom_head: string;
};

const Settings = () => {
  const [settings, setSettings] = useState<SiteSettings>({
    sitename: "",
    desc: "",
    allow_cros: false,
    geoip_enable: false,
    geoip_provider: "",
    oauth_id: "",
    oauth_secret: "",
    oauth_enable: false,
    custom_head: "",
  });
  const { t } = useTranslation();

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        const { CreatedAt, UpdatedAt, id, ...filteredSettings } = data;
        setSettings(filteredSettings as SiteSettings);
      })
      .catch((error) => console.error("Failed to fetch settings:", error));
  }, []);

  // Generic handler for settings changes
  const handleSettingsChange = async <K extends keyof SiteSettings>(
    key: K,
    value: SiteSettings[K]
  ) => {
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings),
      });
    } catch (error) {
      alert(`Failed to save ${key}: ${error}`);
    }
  };

  return (
    <Flex direction="column" gap="3">
      <Text size="6" weight="bold">
        {t("settings")}
      </Text>
      {/** Sitename */}
      <SettingCard
        title="settings_sitename"
        description="settings_sitename_desc"
        children={
          <Popover.Root>
            <Popover.Trigger>
              <IconButton>
                <Pencil1Icon />
              </IconButton>
            </Popover.Trigger>
            <Popover.Content>
              <Flex direction="row" gap="3">
                <TextField.Root id="sitename"
                  value={settings.sitename}
                ></TextField.Root>
                <Button
                  onClick={() => {
                    handleSettingsChange("sitename", "123");
                  }}
                >
                  {t("save")}
                </Button>
              </Flex>
            </Popover.Content>
          </Popover.Root>
        }
      />
      {/** Sitedesc */}
      <SettingCard
        title="settings_sitedesc"
        description="settings_sitedesc_desc"
        children={
          <Popover.Root>
            <Popover.Trigger>
              <IconButton>
                <Pencil1Icon />
              </IconButton>
            </Popover.Trigger>
            <Popover.Content>
              <Flex direction="row" gap="3">
                <TextField.Root
                  
                ></TextField.Root>
                <Button
                  onClick={() => {
                   
                  }}
                >
                  {t("save")}
                </Button>
              </Flex>
            </Popover.Content>
          </Popover.Root>
        }
      />
      {/** Allow CROS */}
      <SettingCard
        title="settings_cros"
        description="settings_cros_desc"
        children={
          <Switch
            checked={settings.allow_cros}
            onCheckedChange={(checked) =>
              handleSettingsChange("allow_cros", checked)
            }
          />
        }
      />
      {/** GeoIP */}
      <SettingCard
        title="settings_geoip_enable"
        description="settings_geoip_enable_desc"
        children={
          <Switch
            checked={settings.geoip_enable}
            onCheckedChange={(checked) =>
              handleSettingsChange("geoip_enable", checked)
            }
          />
        }
      />
      <SettingCard
        title="settings_geoip"
        description="settings_geoip_desc"
        children={
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Button variant="soft">
                {settings.geoip_provider || "Select Provider"}
                <DropdownMenu.TriggerIcon />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              {["mmdb"].map((provider) => (
                <DropdownMenu.Item
                  key={provider}
                  onSelect={() =>
                    handleSettingsChange("geoip_provider", provider)
                  }
                >
                  {provider}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        }
      />
    </Flex>
  );
};





type SettingCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

const SettingCard = ({ title, description, children }: SettingCardProps) => {
  const { t } = useTranslation();
  return (
    <Card size="2">
      <Flex
        direction="row"
        gap="2"
        justify="between"
        align="center"
        wrap="wrap"
      >
        <Flex direction="column" wrap="wrap" gap="1">
          <Text size="2">{t(title)}</Text>
          <Text size="1">{t(description)}</Text>
        </Flex>
        {children && (
          <Flex direction="column" gap="1">
            {children}
          </Flex>
        )}
      </Flex>
    </Card>
  );
};

export default Settings;
