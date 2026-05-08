import React from "react";
import { Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { ITerminalOptions } from "xterm";
import {
  SettingCardButton,
  SettingCardLabel,
  SettingCardShortTextInput,
  SettingCardSwitch,
} from "@/components/admin/SettingCard";
import {
  useXtermjsSettings,
  type XtermjsSettings,
} from "@/hooks/useXtermjsSettings";

export default function XtermjsSettingsPage() {
  const { t } = useTranslation();
  const { settings, setSettings, resetSettings } = useXtermjsSettings();
  const [formKey, setFormKey] = React.useState(0);

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

      <SettingCardShortTextInput
        title={t("settings.xtermjs.font_weight")}
        defaultValue={settings.terminalOptions.fontWeight?.toString() || ""}
        placeholder="normal"
        OnSave={async (value) => {
          const normalizedValue = value.trim();
          patchTerminalOptions((current) => ({
            ...current,
            fontWeight: normalizedValue
              ? (normalizedValue as ITerminalOptions["fontWeight"])
              : undefined,
          }));
          toast.success(t("settings.settings_saved"));
        }}
      />

      <SettingCardShortTextInput
        title={t("settings.xtermjs.font_weight_bold")}
        defaultValue={settings.terminalOptions.fontWeightBold?.toString() || ""}
        placeholder="bold"
        OnSave={async (value) => {
          const normalizedValue = value.trim();
          patchTerminalOptions((current) => ({
            ...current,
            fontWeightBold: normalizedValue
              ? (normalizedValue as ITerminalOptions["fontWeight"])
              : undefined,
          }));
          toast.success(t("settings.settings_saved"));
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

      <SettingCardShortTextInput
        title={t("settings.xtermjs.container_background")}
        defaultValue={settings.containerBackground || "#000000"}
        placeholder="#000000"
        OnSave={async (value) => {
          patchSettings((current) => ({
            ...current,
            containerBackground: value,
          }));
          toast.success(t("settings.settings_saved"));
        }}
      />

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

      <SettingCardShortTextInput
        title={t("settings.xtermjs.scrollbar_track")}
        defaultValue={settings.scrollbarTrack || "#1e1e1e"}
        placeholder="#1e1e1e"
        OnSave={async (value) => {
          patchSettings((current) => ({
            ...current,
            scrollbarTrack: value,
          }));
          toast.success(t("settings.settings_saved"));
        }}
      />

      <SettingCardShortTextInput
        title={t("settings.xtermjs.scrollbar_thumb")}
        defaultValue={settings.scrollbarThumb || "#555555"}
        placeholder="#555555"
        OnSave={async (value) => {
          patchSettings((current) => ({
            ...current,
            scrollbarThumb: value,
          }));
          toast.success(t("settings.settings_saved"));
        }}
      />

      <SettingCardShortTextInput
        title={t("settings.xtermjs.scrollbar_thumb_hover")}
        defaultValue={settings.scrollbarThumbHover || "#777777"}
        placeholder="#777777"
        OnSave={async (value) => {
          patchSettings((current) => ({
            ...current,
            scrollbarThumbHover: value,
          }));
          toast.success(t("settings.settings_saved"));
        }}
      />
    </Flex>
  );
}
