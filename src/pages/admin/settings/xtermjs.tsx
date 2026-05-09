import React from "react";
import { Callout, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import {
  SettingCardButton,
  SettingCardLabel,
  SettingCardLongTextInput,
  SettingCardShortTextInput,
  SettingCardSwitch,
} from "@/components/admin/SettingCard";
import {
  formatXtermThemeJson,
  isTransparentBackground,
  parseXtermThemeJson,
  useXtermjsSettings,
  type XtermjsSettings,
} from "@/hooks/useXtermjsSettings";

export default function XtermjsSettingsPage() {
  const { t } = useTranslation();
  const { settings, setSettings, resetSettings } = useXtermjsSettings();
  const [formKey, setFormKey] = React.useState(0);
  const [themeJsonRevision, setThemeJsonRevision] = React.useState(0);
  const [customCssRevision, setCustomCssRevision] = React.useState(0);

  const patchSettings = React.useCallback(
    (updater: (current: XtermjsSettings) => XtermjsSettings) => {
      setSettings(updater);
    },
    [setSettings]
  );

  const patchTerminalOptions = React.useCallback(
    (
      updater: (
        current: XtermjsSettings["terminalOptions"]
      ) => XtermjsSettings["terminalOptions"]
    ) => {
      patchSettings((current) => ({
        ...current,
        terminalOptions: updater(current.terminalOptions),
      }));
    },
    [patchSettings]
  );

  const saveIntegerField = React.useCallback(
    (
      fieldLabel: string,
      rawValue: string,
      minimum: number,
      apply: (value: number) => void
    ) => {
      const normalizedValue = rawValue.trim();
      const parsed = Number.parseInt(normalizedValue, 10);
      if (
        !/^\d+$/.test(normalizedValue) ||
        !Number.isInteger(parsed) ||
        parsed < minimum
      ) {
        toast.error(`${fieldLabel} ${t("settings.invalid_integer")}`);
        return;
      }

      apply(parsed);
      toast.success(t("settings.settings_saved"));
    },
    [t]
  );

  const handleReset = React.useCallback(async () => {
    resetSettings();
    setFormKey((value) => value + 1);
    toast.success(t("settings.settings_saved"));
  }, [resetSettings, t]);

  const handleThemeJsonSave = React.useCallback(
    async (value: string) => {
      const parsed = parseXtermThemeJson(value);

      if (parsed.status === "invalid_json") {
        toast.error(t("settings.xtermjs.theme_json_invalid"));
        return;
      }

      if (parsed.status === "non_object") {
        toast.error(t("settings.xtermjs.theme_json_must_be_object"));
        return;
      }

      setSettings((current) => ({
        ...current,
        terminalOptions: {
          ...current.terminalOptions,
          theme: parsed.theme,
        },
      }));
      setThemeJsonRevision((current) => current + 1);

      if (parsed.filtered) {
        toast.warning(t("settings.xtermjs.theme_json_filtered"));
      } else {
        toast.success(t("settings.settings_saved"));
      }
    },
    [setSettings, t]
  );

  const handleCustomCssSave = React.useCallback(
    async (value: string) => {
      setSettings((current) => ({
        ...current,
        customCss: value,
      }));
      setCustomCssRevision((current) => current + 1);
      toast.success(t("settings.settings_saved"));
    },
    [setSettings, t]
  );

  const themeBackgroundIsOpaque =
    settings.transparentBackground &&
    settings.terminalOptions.theme?.background !== undefined &&
    !isTransparentBackground(settings.terminalOptions.theme.background);

  return (
    <Flex key={formKey} direction="column" gap="3">
      <SettingCardLabel>{t("settings.xtermjs.title")}</SettingCardLabel>
      <SettingCardButton
        title={t("settings.xtermjs.title")}
        description={t("settings.xtermjs.reset_defaults")}
        onClick={handleReset}
      >
        {t("common.reset", "Reset")}
      </SettingCardButton>

      <SettingCardShortTextInput
        title={t("settings.xtermjs.font_family")}
        defaultValue={settings.terminalOptions.fontFamily || ""}
        placeholder="'Cascadia Mono', 'Noto Sans SC', monospace"
        OnSave={async (value) => {
          patchTerminalOptions((current) => ({
            ...current,
            fontFamily: value,
          }));
          toast.success(t("settings.settings_saved"));
        }}
      />

      <SettingCardShortTextInput
        title={t("settings.xtermjs.font_size")}
        defaultValue={settings.terminalOptions.fontSize?.toString() || "16"}
        placeholder="16"
        inputMode="numeric"
        OnSave={async (value) => {
          saveIntegerField(t("settings.xtermjs.font_size"), value, 1, (next) => {
            patchTerminalOptions((current) => ({
              ...current,
              fontSize: next,
            }));
          });
        }}
      />

      <SettingCardSwitch
        title={t("settings.xtermjs.cursor_blink")}
        defaultChecked={Boolean(settings.terminalOptions.cursorBlink)}
        onChange={async (checked) => {
          patchTerminalOptions((current) => ({
            ...current,
            cursorBlink: checked,
          }));
          toast.success(t("settings.settings_saved"));
        }}
      />

      <SettingCardShortTextInput
        title={t("settings.xtermjs.scrollback")}
        defaultValue={settings.terminalOptions.scrollback?.toString() || "5000"}
        placeholder="5000"
        inputMode="numeric"
        OnSave={async (value) => {
          saveIntegerField(t("settings.xtermjs.scrollback"), value, 0, (next) => {
            patchTerminalOptions((current) => ({
              ...current,
              scrollback: next,
            }));
          });
        }}
      />

      <SettingCardSwitch
        title={t("settings.xtermjs.convert_eol")}
        defaultChecked={Boolean(settings.terminalOptions.convertEol)}
        onChange={async (checked) => {
          patchTerminalOptions((current) => ({
            ...current,
            convertEol: checked,
          }));
          toast.success(t("settings.settings_saved"));
        }}
      />

      <SettingCardSwitch
        title={t("settings.xtermjs.transparent_background")}
        description={t("settings.xtermjs.transparent_hint")}
        defaultChecked={settings.transparentBackground}
        onChange={async (checked) => {
          patchSettings((current) => ({
            ...current,
            transparentBackground: checked,
          }));
          toast.success(t("settings.settings_saved"));
        }}
      />

      {themeBackgroundIsOpaque && (
        <Callout.Root color="amber" size="1">
          <Callout.Icon>
            <AlertTriangle size={16} />
          </Callout.Icon>
          <Callout.Text>
            {t("settings.xtermjs.transparent_theme_hint")}
          </Callout.Text>
        </Callout.Root>
      )}

      <SettingCardShortTextInput
        title={t("settings.xtermjs.terminal_padding")}
        defaultValue={settings.terminalPadding?.toString() || "16"}
        placeholder="16"
        inputMode="numeric"
        OnSave={async (value) => {
          saveIntegerField(
            t("settings.xtermjs.terminal_padding"),
            value,
            0,
            (next) => {
              patchSettings((current) => ({
                ...current,
                terminalPadding: next,
              }));
            }
          );
        }}
      />

      <SettingCardLongTextInput
        key={`theme-json-${themeJsonRevision}`}
        title={t("settings.xtermjs.theme_json")}
        description={t("settings.xtermjs.theme_json_description")}
        defaultValue={formatXtermThemeJson(settings.terminalOptions.theme)}
        OnSave={handleThemeJsonSave}
      />

      <SettingCardLongTextInput
        key={`custom-css-${customCssRevision}`}
        title={t("settings.xtermjs.custom_css")}
        description={t("settings.xtermjs.custom_css_description")}
        defaultValue={settings.customCss || ""}
        OnSave={handleCustomCssSave}
      />
    </Flex>
  );
}
