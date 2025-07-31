import {
  SettingCardLabel,
  SettingCardSelect,
  SettingCardSwitch,
} from "@/components/admin/SettingCard";
import { updateSettingsWithToast, useSettings } from "@/lib/api";
import { Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { SettingCardMultiInputCollapse } from "@/components/admin/SettingCardMultiInput";
import Loading from "@/components/loading";
import React from "react";

export default function SignOnSettings() {
  const { t } = useTranslation();
  const { settings, loading, error } = useSettings();
  const [providerDefs, setProviderDefs] = React.useState<any>({});
  const [providerList, setProviderList] = React.useState<string[]>([]);
  const [currentProvider, setCurrentProvider] = React.useState<string>("");
  const [providerValues, setProviderValues] = React.useState<any>({});
  const [providerLoading, setProviderLoading] = React.useState(false);
  const [providerError, setProviderError] = React.useState("");

  // 拉取所有 provider 及字段定义
  React.useEffect(() => {
    if (loading) return;
    setProviderLoading(true);
    fetch("/api/admin/settings/oidc")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success" && data.data) {
          setProviderDefs(data.data);
          const providers = Object.keys(data.data);
          setProviderList(providers);
          const initialProvider =
            settings.o_auth_provider && providers.includes(settings.o_auth_provider)
              ? settings.o_auth_provider
              : providers[0] || "";
          setCurrentProvider(initialProvider);
        } else {
          setProviderError(data.message || "获取登录接口信息失败");
        }
      })
      .catch(() => setProviderError("获取登录接口信息失败"))
      .finally(() => setProviderLoading(false));
  }, [loading, settings.o_auth_provider]);

  // 拉取当前 provider 的设置
  React.useEffect(() => {
    if (!currentProvider) return;
    setProviderLoading(true);
    fetch(`/api/admin/settings/oidc?provider=${currentProvider}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success" && data.data) {
          try {
            setProviderValues(JSON.parse(data.data.addition || "{}"));
          } catch {
            setProviderValues({});
          }
        } else {
          setProviderError(data.message || "获取设置失败");
        }
      })
      .catch(() => setProviderError("获取设置失败"))
      .finally(() => setProviderLoading(false));
  }, [currentProvider]);

  // 处理保存
  const handleOidcSave = async (values: any) => {
    setProviderLoading(true);
    setProviderError("");
    const body = {
      name: currentProvider,
      addition: JSON.stringify(values),
    };
    try {
      const res = await fetch("/api/admin/settings/oidc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.status !== "success") {
        setProviderError(data.message || "保存失败");
      } else {
        setProviderValues(values);
      }
    } catch {
      setProviderError("保存失败");
    }
    setProviderLoading(false);
  };

  // 渲染 provider 的输入项
  const renderProviderInputs = () => {
    if (!currentProvider || !providerDefs[currentProvider]) return null;
    const fields = providerDefs[currentProvider];
    const selectFields = fields.filter((f: any) => f.type === "option" && f.options);
    const switchFields = fields.filter((f: any) => f.type === "bool");
    const inputFields = fields.filter((f: any) => f.type !== "option" && f.type !== "bool");

    return (
      <div key={currentProvider}>
        {selectFields.map((f: any) => (
          <SettingCardSelect
            key={f.name}
            title={String(t(`settings.sso.${f.name}`, f.name))}
            options={f.options.split(",").map((opt: string) => ({ value: opt, label: opt }))}
            defaultValue={providerValues[f.name] || ""}
            OnSave={(val: string) => setProviderValues((v: any) => ({ ...v, [f.name]: val }))}
          />
        ))}
        {switchFields.map((f: any) => (
          <SettingCardSwitch
            key={f.name}
            title={String(t(`settings.sso.${f.name}`, f.name))}
            defaultChecked={!!providerValues[f.name]}
            onChange={(checked: boolean) => setProviderValues((v: any) => ({ ...v, [f.name]: checked }))}
          />
        ))}
        {inputFields.length > 0 && (
          <SettingCardMultiInputCollapse
            title={String(t("settings.sso.provider_fields"))}
            defaultOpen={true}
            items={inputFields.map((f: any) => ({
              tag: f.name,
              label: String(t(`settings.sso.${f.name}`, f.name)),
              type: "short",
              defaultValue: providerValues[f.name] || "",
              required: f.required,
            }))}
            onSave={async (values: any) => {
              const allValues = { ...providerValues, ...values };
              await handleOidcSave(allValues);
            }}
          >
            <label className="text-sm text-muted-foreground">
              {String(t("settings.sso.callback_url_tips", { url: `${window.location.origin}/api/oauth_callback` }))}
            </label>
          </SettingCardMultiInputCollapse>
        )}
      </div>
    );
  };

  if (loading || (!providerLoading && providerList.length === 0 && !providerError)) {
    return <Loading />;
  }
  if (error) {
    return <Text color="red">{error}</Text>;
  }
  if (providerError) {
    return <Text color="red">{providerError}</Text>;
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
        title={String(t("settings.sso.provider"))}
        description={String(t("settings.sso.provider_description"))}
        options={providerList.map((p) => ({ value: p, label: p }))}
        value={currentProvider}
        OnSave={async (val: string) => {
          if (val === currentProvider) return;
          await updateSettingsWithToast({ o_auth_provider: val }, t);
          setCurrentProvider(val);
        }}
      />
      {providerLoading ? <Loading/> : renderProviderInputs()}
    </>
  );
}
