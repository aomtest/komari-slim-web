import { useCallback, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ITerminalOptions, ITheme } from "xterm";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export const XTERMJS_SETTINGS_STORAGE_KEY = "komari:xtermjs-settings";

const DEFAULT_FONT_FAMILY = "'Cascadia Mono', 'Noto Sans SC', monospace";
const DEFAULT_FONT_SIZE = 16;
const DEFAULT_SCROLLBACK = 5000;
const DEFAULT_CONTAINER_BACKGROUND = "#000000";
const DEFAULT_SCROLLBAR_TRACK = "#1e1e1e";
const DEFAULT_SCROLLBAR_THUMB = "#555555";
const DEFAULT_SCROLLBAR_THUMB_HOVER = "#777777";
const FONT_WEIGHT_STRING_VALUES = [
  "normal",
  "bold",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
] as const;

type XtermStringThemeKey = Exclude<keyof ITheme, "extendedAnsi">;

export const xtermThemeWhitelist: (keyof ITheme)[] = [
  "foreground",
  "background",
  "cursor",
  "cursorAccent",
  "selectionForeground",
  "selectionBackground",
  "selectionInactiveBackground",
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
  "brightBlack",
  "brightRed",
  "brightGreen",
  "brightYellow",
  "brightBlue",
  "brightMagenta",
  "brightCyan",
  "brightWhite",
  "extendedAnsi",
];

export interface ParsedXtermThemeJson {
  theme: Partial<ITheme> | undefined;
  filtered: boolean;
}

export type XtermThemeJsonParseResult =
  | { status: "invalid_json" }
  | { status: "non_object" }
  | ({ status: "ok" } & ParsedXtermThemeJson);

export interface XtermjsTerminalOptions
  extends Pick<
    ITerminalOptions,
    | "cursorBlink"
    | "convertEol"
    | "fontFamily"
    | "fontSize"
    | "fontWeight"
    | "fontWeightBold"
    | "macOptionIsMeta"
    | "scrollback"
  > {
  theme?: Partial<ITheme>;
}

export interface XtermjsSettings {
  terminalOptions: XtermjsTerminalOptions;
  terminalPadding: number;
  containerBackground: string;
  scrollbarTrack: string;
  scrollbarThumb: string;
  scrollbarThumbHover: string;
  transparentBackground: boolean;
  customCss: string;
}

export const defaultXtermjsSettings: XtermjsSettings = {
  terminalOptions: {
    cursorBlink: true,
    convertEol: true,
    fontFamily: DEFAULT_FONT_FAMILY,
    fontSize: DEFAULT_FONT_SIZE,
    fontWeight: undefined,
    fontWeightBold: undefined,
    macOptionIsMeta: true,
    scrollback: DEFAULT_SCROLLBACK,
    theme: undefined,
  },
  terminalPadding: 16,
  containerBackground: DEFAULT_CONTAINER_BACKGROUND,
  scrollbarTrack: DEFAULT_SCROLLBAR_TRACK,
  scrollbarThumb: DEFAULT_SCROLLBAR_THUMB,
  scrollbarThumbHover: DEFAULT_SCROLLBAR_THUMB_HOVER,
  transparentBackground: false,
  customCss: "",
};

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (Object.prototype.toString.call(value) !== "[object Object]") {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function createDefaultXtermjsSettings(): XtermjsSettings {
  return {
    terminalOptions: {
      ...defaultXtermjsSettings.terminalOptions,
      theme: undefined,
    },
    terminalPadding: defaultXtermjsSettings.terminalPadding,
    containerBackground: defaultXtermjsSettings.containerBackground,
    scrollbarTrack: defaultXtermjsSettings.scrollbarTrack,
    scrollbarThumb: defaultXtermjsSettings.scrollbarThumb,
    scrollbarThumbHover: defaultXtermjsSettings.scrollbarThumbHover,
    transparentBackground: defaultXtermjsSettings.transparentBackground,
    customCss: defaultXtermjsSettings.customCss,
  };
}

function normalizeNonEmptyString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : fallback;
}

function normalizeNumber(
  value: unknown,
  fallback: number,
  minimum: number
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(minimum, Math.trunc(value));
}

function normalizeFontWeight(value: unknown): ITerminalOptions["fontWeight"] {
  if (typeof value === "string") {
    const normalized = value.trim();
    if (
      FONT_WEIGHT_STRING_VALUES.includes(
        normalized as (typeof FONT_WEIGHT_STRING_VALUES)[number]
      )
    ) {
      return normalized as ITerminalOptions["fontWeight"];
    }

    return undefined;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return undefined;
}

function sanitizeThemeObject(value: Record<string, unknown>): ParsedXtermThemeJson {
  const theme: Partial<ITheme> = {};
  let filtered = false;

  for (const [key, rawValue] of Object.entries(value)) {
    if (!xtermThemeWhitelist.includes(key as keyof ITheme)) {
      filtered = true;
      continue;
    }

    if (key === "extendedAnsi") {
      if (
        Array.isArray(rawValue) &&
        rawValue.every(
          (color) => typeof color === "string" && color.trim().length > 0
        )
      ) {
        theme.extendedAnsi = rawValue;
      } else if (rawValue !== undefined) {
        filtered = true;
      }
      continue;
    }

    if (typeof rawValue === "string" && rawValue.trim().length > 0) {
      theme[key as XtermStringThemeKey] = rawValue;
    } else if (rawValue !== undefined) {
      filtered = true;
    }
  }

  return {
    theme: Object.keys(theme).length > 0 ? theme : undefined,
    filtered,
  };
}

export function parseXtermThemeJson(
  rawValue: string
): XtermThemeJsonParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawValue);
  } catch {
    return { status: "invalid_json" };
  }

  if (!isPlainObject(parsed)) {
    return { status: "non_object" };
  }

  return { status: "ok", ...sanitizeThemeObject(parsed) };
}

export function formatXtermThemeJson(value: Partial<ITheme> | undefined): string {
  return JSON.stringify(value ?? {}, null, 2);
}

function sanitizeThemeValue(value: unknown): Partial<ITheme> | undefined {
  if (!isPlainObject(value)) {
    return undefined;
  }

  return sanitizeThemeObject(value).theme;
}

export function sanitizeXtermjsSettings(value: unknown): XtermjsSettings {
  const fallback = createDefaultXtermjsSettings();

  if (!isPlainObject(value)) {
    return fallback;
  }

  const terminalOptions = isPlainObject(value.terminalOptions)
    ? value.terminalOptions
    : {};

  return {
    terminalOptions: {
      cursorBlink:
        typeof terminalOptions.cursorBlink === "boolean"
          ? terminalOptions.cursorBlink
          : fallback.terminalOptions.cursorBlink,
      convertEol:
        typeof terminalOptions.convertEol === "boolean"
          ? terminalOptions.convertEol
          : fallback.terminalOptions.convertEol,
      fontFamily: normalizeNonEmptyString(
        terminalOptions.fontFamily,
        fallback.terminalOptions.fontFamily!
      ),
      fontSize: normalizeNumber(
        terminalOptions.fontSize,
        fallback.terminalOptions.fontSize!,
        1
      ),
      fontWeight: normalizeFontWeight(terminalOptions.fontWeight),
      fontWeightBold: normalizeFontWeight(terminalOptions.fontWeightBold),
      macOptionIsMeta:
        typeof terminalOptions.macOptionIsMeta === "boolean"
          ? terminalOptions.macOptionIsMeta
          : fallback.terminalOptions.macOptionIsMeta,
      scrollback: normalizeNumber(
        terminalOptions.scrollback,
        fallback.terminalOptions.scrollback!,
        0
      ),
      theme: sanitizeThemeValue(terminalOptions.theme),
    },
    terminalPadding: normalizeNumber(
      value.terminalPadding,
      fallback.terminalPadding,
      0
    ),
    containerBackground: normalizeNonEmptyString(
      value.containerBackground,
      fallback.containerBackground
    ),
    scrollbarTrack: normalizeNonEmptyString(
      value.scrollbarTrack,
      fallback.scrollbarTrack
    ),
    scrollbarThumb: normalizeNonEmptyString(
      value.scrollbarThumb,
      fallback.scrollbarThumb
    ),
    scrollbarThumbHover: normalizeNonEmptyString(
      value.scrollbarThumbHover,
      fallback.scrollbarThumbHover
    ),
    transparentBackground:
      typeof value.transparentBackground === "boolean"
        ? value.transparentBackground
        : fallback.transparentBackground,
    customCss:
      typeof value.customCss === "string"
        ? value.customCss
        : fallback.customCss,
  };
}

export function isTransparentBackground(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  if (normalized === "transparent" || normalized === "none") {
    return true;
  }

  const isTransparentAlpha = (rawAlpha: string): boolean => {
    const alphaValue = rawAlpha.trim();
    if (!alphaValue) {
      return false;
    }

    if (alphaValue.endsWith("%")) {
      const percentage = Number.parseFloat(alphaValue.slice(0, -1));
      return Number.isFinite(percentage) && percentage < 100;
    }

    const alpha = Number.parseFloat(alphaValue);
    return Number.isFinite(alpha) && alpha < 1;
  };

  const hexMatch = normalized.match(/^#([0-9a-f]{4}|[0-9a-f]{8})$/i);
  if (hexMatch) {
    const alphaHex =
      hexMatch[1].length === 4 ? hexMatch[1][3] : hexMatch[1].slice(6, 8);
    return Number.parseInt(alphaHex, 16) < 255;
  }

  const functionalColorMatch = normalized.match(/^(rgba?|hsla?)\((.+)\)$/i);
  if (functionalColorMatch) {
    const colorBody = functionalColorMatch[2];
    const slashAlpha = colorBody.split("/")[1]?.trim();
    if (slashAlpha) {
      return isTransparentAlpha(slashAlpha);
    }

    const parts = colorBody
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 4) {
      return isTransparentAlpha(parts[3]);
    }

    return false;
  }

  return false;
}

export function useXtermjsSettings() {
  const [storedSettings, setStoredSettings] = useLocalStorage<XtermjsSettings>(
    XTERMJS_SETTINGS_STORAGE_KEY,
    defaultXtermjsSettings
  );

  const settings = useMemo(
    () => sanitizeXtermjsSettings(storedSettings),
    [storedSettings]
  );

  const setSettings: Dispatch<SetStateAction<XtermjsSettings>> = useCallback(
    (value) => {
      setStoredSettings((current) => {
        const nextSettings =
          typeof value === "function"
            ? value(sanitizeXtermjsSettings(current))
            : value;

        return sanitizeXtermjsSettings(nextSettings);
      });
    },
    [setStoredSettings]
  );

  const resetSettings = useCallback(() => {
    setStoredSettings(createDefaultXtermjsSettings());
  }, [setStoredSettings]);

  return {
    settings,
    setSettings,
    resetSettings,
  };
}
