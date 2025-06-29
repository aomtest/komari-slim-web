import { useTranslation } from "react-i18next";
import { Button, Code, Flex, Text, TextField } from "@radix-ui/themes";
import { updateSettingsWithToast, useSettings } from "@/lib/api";
import {
  SettingCardButton,
  SettingCardCollapse,
  SettingCardSelect,
  SettingCardSwitch,
} from "@/components/admin/SettingCard";
import React from "react";
import { toast } from "sonner";
import Loading from "@/components/loading";
import { SettingCardMultiInputCollapse } from "@/components/admin/SettingCardMultiInput";
import { formatBytes } from "@/components/Node";
export default function GeneralSettings() {
  const { t } = useTranslation();
  const { settings, loading, error } = useSettings();
  const [geoip_testResult, setGeoipTestResult] = React.useState<string | null>(
    null
  );
  const [expected_usage, setExpectedUsage] = React.useState<string | null>(
    null
  );
  React.useEffect(() => {
    const pingPreserveTime = parseInt(
      settings.ping_record_preserve_time || "30",
      10
    );
    const recordPreserveTime = parseInt(
      settings.record_preserve_time || "30",
      10
    );
    if (isNaN(pingPreserveTime) || isNaN(recordPreserveTime)) {
      setExpectedUsage("0");
      return;
    } else {
      setExpectedUsage(
        calculateExpectedUsage(pingPreserveTime, recordPreserveTime)
      );
    }
  }, [settings.ping_record_preserve_time, settings.record_preserve_time]);
  if (loading) {
    return <Loading text="creeper?" />;
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
          { value: "empty", label: t("common.none") },
          { value: "mmdb", label: "MaxMind" },
          { value: "ip-api", label: "ip-api.com" },
          { value: "geojs", label: "geojs.io" },
          { value: "ipinfo", label: "ipinfo.io" },
        ]}
        OnSave={async (value) => {
          await updateSettingsWithToast({ geo_ip_provider: value }, t);
        }}
      />
      <SettingCardButton
        title={t("settings.geoip.update_title", "更新 GeoIP 数据库")}
        onClick={async () => {
          const result = await fetch("/api/admin/update/mmdb", {
            method: "POST",
          });
          const data = await result.json();
          if (data.status === "success") {
            toast.success(
              t("settings.geoip.update_success", "GeoIP 数据库更新成功")
            );
          } else {
            toast.error(
              data.message ||
                t("settings.geoip.update_error", "更新 GeoIP 数据库失败")
            );
          }
        }}
      >
        {t("common.update", "更新")}
      </SettingCardButton>
      <SettingCardCollapse
        title={t("settings.geoip.test_title")}
        description={t("settings.geoip.test_description")}
      >
        <Flex className="w-full gap-2" direction="column">
          <TextField.Root placeholder="1.1.1.1 or 2606:4700:4700::1111"></TextField.Root>
          <div>
            <Button
              variant="solid"
              onClick={async () => {
                const ip = (
                  document.querySelector(
                    "input[placeholder]"
                  ) as HTMLInputElement
                ).value;
                const result = await fetch(`/api/admin/test/geoip?ip=${ip}`);
                const data = await result.json();
                setGeoipTestResult(
                  JSON.stringify(data.data, null, 2) || "无结果"
                );
              }}
            >
              {t("settings.geoip.test_button", "测试")}
            </Button>
          </div>{" "}
          <Flex className="w-full">
            {geoip_testResult && (
              <Code
                className="w-full whitespace-pre-wrap text-sm p-3 rounded-md overflow-auto max-h-96"
                style={{ display: "block" }}
              >
                {geoip_testResult}
              </Code>
            )}
          </Flex>
        </Flex>
      </SettingCardCollapse>
      <label className="text-xl font-bold">{t("settings.record.title")}</label>
      <SettingCardSwitch
        title={t("settings.record.enabled")}
        description={t("settings.record.enabled_description")}
        defaultChecked={settings.record_enabled}
        onChange={async (checked) => {
          await updateSettingsWithToast({ record_enabled: checked }, t);
        }}
      />
      <SettingCardMultiInputCollapse
        defaultOpen
        title={t("settings.record.record_preserve_time")}
        description={t("settings.record.record_preserve_time_description")}
        items={[
          {
            tag: "record_preserve_time",
            label: t("settings.record.record_preserve_time_label"),
            type: "short",
            placeholder: "30",
            defaultValue: settings.record_preserve_time || "30",
            number: true,
          },
          {
            tag: "ping_record_preserve_time",
            label: t("settings.record.ping_record_preserve_time"),
            type: "short",
            placeholder: "30",
            defaultValue: settings.ping_record_preserve_time || "30",
            number: true,
          },
        ]}
        onSave={async (values) => {
          const preserveTime = parseInt(values.record_preserve_time, 10);
          const pingPreserveTime = parseInt(
            values.ping_record_preserve_time,
            10
          );
          if (isNaN(preserveTime) || isNaN(pingPreserveTime)) {
            toast.error(t("settings.record.invalid_preserve_time"));
            return;
          }
          await updateSettingsWithToast(
            {
              record_preserve_time: preserveTime,
              ping_record_preserve_time: pingPreserveTime,
            },
            t
          );
        }}
        onChange={(values) => {
          const preserveTime = parseInt(values.record_preserve_time, 10);
          const pingPreserveTime = parseInt(
            values.ping_record_preserve_time,
            10
          );
          if (isNaN(preserveTime) || isNaN(pingPreserveTime)) {
            setExpectedUsage("0");
            return;
          }
          setExpectedUsage(
            calculateExpectedUsage(pingPreserveTime, preserveTime)
          );
        }}
      >
        <label className="text-sm text-muted-foreground">
          {t("settings.record.expected_usage", {
            space: expected_usage,
          })}
        </label>
      </SettingCardMultiInputCollapse>
    </>
  );
}

function calculateExpectedUsage(
  pingPreserveTime: number,
  recordPreserveTime: number
): string {
  let totalPingBytes = 0;
  let totalRecordBytes = 0;

  // 1 ping/minute * 60 bytes/ping * 60 minutes/hour = 3600 bytes/hour
  totalPingBytes = pingPreserveTime * 3600;

  if (recordPreserveTime <= 4) {
    // First 4 hours: 1 record/minute * 512 bytes/record * 60 minutes/hour = 30720 bytes/hour
    totalRecordBytes = recordPreserveTime * 30720;
  } else {
    // Bytes for the first 4 hours
    totalRecordBytes = 4 * 30720;
    // Bytes for the remaining time (recordPreserveTime - 4)
    // 1 record/15 minutes * 512 bytes/record * (60/15) records/hour = 4 records/hour * 512 bytes/record = 2048 bytes/hour
    totalRecordBytes += (recordPreserveTime - 4) * 2048;
  }

  return formatBytes(totalPingBytes + totalRecordBytes);
}
