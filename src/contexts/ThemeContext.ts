import { createContext } from 'react';

export const allowedColors = [
  "gray", "gold", "bronze", "brown", "yellow", "amber",
  "orange", "tomato", "red", "ruby", "crimson", "pink",
  "plum", "purple", "violet", "iris", "indigo", "blue",
  "cyan", "teal", "jade", "green", "grass", "lime",
  "mint", "sky",
] as const;

export type Colors = typeof allowedColors[number];

export const allowedAppearances = ["light", "dark", "system"] as const;
export type Appearance = typeof allowedAppearances[number];

export const THEME_DEFAULTS = {
  appearance: "system" as Appearance,
  // 品牌蓝：取自项目图标 "komari-slim" 字样（#2F92EE）。
  // Radix 内置的 blue 色相为 206°，与品牌蓝的 209° 只差 3°，
  // 白字对比度也几乎相同（3.26 : 3.25），故直接复用 Radix 的 blue 色阶，
  // 而不是手搓一套自定义色阶。原默认值为 "iris"（#5B5BD6，紫色）。
  color: "blue" as Colors,
} as const;

/** 旧的默认强调色。用于把"只是沿用旧默认值"的用户迁移到品牌蓝。 */
const LEGACY_DEFAULT_COLOR = "iris";
const ACCENT_MIGRATION_KEY = "accent-color-migrated-v1";

/**
 * 一次性迁移：强调色默认值由 iris（紫）改为 blue（品牌蓝）后，
 * 未主动选过颜色的用户 localStorage 里并不会存值，因此直接生效；
 * 但若某个浏览器在旧版本下恰好把 iris 写进了 localStorage，
 * 它就会一直停在紫色。这里把"存的正是旧默认值"的情况清掉，
 * 让其回落到新的品牌蓝默认值。用户主动选过其它颜色则原样保留。
 */
export const migrateLegacyAccentColor = () => {
  try {
    if (localStorage.getItem(ACCENT_MIGRATION_KEY)) return;
    const stored = localStorage.getItem("color");
    if (
      stored === null ||
      stored === LEGACY_DEFAULT_COLOR ||
      stored === JSON.stringify(LEGACY_DEFAULT_COLOR)
    ) {
      localStorage.removeItem("color");
    }
    localStorage.setItem(ACCENT_MIGRATION_KEY, "1");
  } catch {
    // localStorage 不可用（隐私模式等）时忽略，不影响渲染
  }
};

export interface ThemeContextType {
  appearance: Appearance;
  setAppearance: (appearance: Appearance) => void;
  color: Colors;
  setColor: (color: Colors) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  appearance: THEME_DEFAULTS.appearance,
  setAppearance: () => {},
  color: THEME_DEFAULTS.color,
  setColor: () => {},
});

