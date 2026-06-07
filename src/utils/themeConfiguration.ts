export const THEME_CONFIGURATION_MANAGED = "managed";
export const THEME_CONFIGURATION_RAW = "raw";
export const THEME_CONFIGURATION_REDIRECT = "redirect";

export interface ThemeConfiguration {
  type?: string;
  icon?: string;
  name?: unknown;
  data?: unknown;
}

export const getThemeConfigurationType = (
  configuration?: ThemeConfiguration,
) => (configuration?.type || THEME_CONFIGURATION_MANAGED).trim().toLowerCase();

export const getRawThemeHtml = (configuration?: ThemeConfiguration) =>
  getThemeConfigurationType(configuration) === THEME_CONFIGURATION_RAW &&
  typeof configuration?.data === "string"
    ? configuration.data
    : "";

export const normalizeThemeRedirectTarget = (
  data: unknown,
  basePath = "/admin",
) => {
  if (typeof data !== "string") return null;

  const target = data.trim();
  if (!target || target.startsWith("//") || target.includes("\\")) return null;

  let url: URL;
  try {
    const base = target.startsWith("/")
      ? window.location.origin
      : `${window.location.origin}${basePath.replace(/\/$/, "")}/`;
    url = new URL(target, base);
  } catch {
    return null;
  }

  if (url.origin !== window.location.origin) return null;
  if (url.pathname.split("/").includes("..")) return null;

  return `${url.pathname}${url.search}${url.hash}`;
};
