import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
// Only inline the fallback language to keep initial bundle small
import zh_CN from "./locales/zh_CN.json";

// Supported language list (for UI display or checks)
// 不添加 name 字段的语言将不会在语言切换菜单中显示
const supportedLanguages: Record<string, { name?: string }> = {
  "en-US": { name: "English" },
  "zh-CN": { name: "简体中文" },
  "zh-SG": {}, // Singapore uses Simplified Chinese
  "zh-TW": { name: "繁體中文" },
  "zh-HK": {}, // Hong Kong uses Traditional Chinese
  "zh-MO": {}, // Macau uses Traditional Chinese
  "ja-JP": { name: "日本語" },
  "id-ID": { name: "Bahasa Indonesia" },
};

// Map language codes to the file and canonical code we use
function canonicalizeLang(lng?: string): string {
  if (!lng) return "zh-CN";
  const lower = lng.toLowerCase();
  if (lower.startsWith("en")) return "en-US";
  if (lower === "zh" || lower.startsWith("zh-cn") || lower.startsWith("zh-sg"))
    return "zh-CN";
  if (
    lower.startsWith("zh-tw") ||
    lower.startsWith("zh-hk") ||
    lower.startsWith("zh-mo") ||
    lower === "zh-hant"
  )
    return "zh-TW";
  if (lower.startsWith("ja")) return "ja-JP";
  if (lower.startsWith("id") || lower.startsWith("in")) return "id-ID";
  return "zh-CN";
}

// Lazy loaders for each locale (except fallback which is inlined)
const languageLoaders: Record<string, () => Promise<any>> = {
  "en-US": () => import("./locales/en.json"),
  "zh-CN": () => Promise.resolve({ default: zh_CN }),
  "zh-SG": () => Promise.resolve({ default: zh_CN }),
  "zh-TW": () => import("./locales/zh_TW.json"),
  "zh-HK": () => import("./locales/zh_TW.json"),
  "zh-MO": () => import("./locales/zh_TW.json"),
  "ja-JP": () => import("./locales/ja_JP.json"),
  "id-ID": () => import("./locales/id_ID.json"),
};

const i18n = i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Initialize with only fallback resources to keep initial bundle small
    resources: {
      "zh-CN": { translation: zh_CN },
    },
    fallbackLng: "zh-CN",
    interpolation: {
      escapeValue: false, // React handles XSS
    },
    detection: {
      order: ["querystring", "cookie", "localStorage", "navigator", "htmlTag"],
      caches: ["localStorage", "cookie"],
    },
  });

async function ensureLanguage(lang: string) {
  const canonical = canonicalizeLang(lang);
  if (i18next.hasResourceBundle(canonical, "translation")) return;
  const loader = languageLoaders[canonical];
  if (!loader) return;
  try {
    const mod = await loader();
    const data = mod?.default ?? mod;
    i18next.addResourceBundle(canonical, "translation", data, true, true);
  } catch (e) {
    // silently ignore load errors, fallback will be used
    // console.warn("Failed to load locale", canonical, e);
  }
}

// Load detected language bundle after init
void (async () => {
  const detected = i18next.resolvedLanguage || i18next.language || "zh-CN";
  await ensureLanguage(detected);
})();

// When language changes (via UI), lazy-load bundle if needed
i18next.on("languageChanged", (lng) => {
  void ensureLanguage(lng);
});

export default i18n;
export { supportedLanguages };
