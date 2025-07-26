import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import zh_CN from "./locales/zh_CN.json";
import zh_TW from "./locales/zh_TW.json";

const resources = {
  "en-US": {
    translation: en,
  },
  "zh-CN": {
    translation: zh_CN,
  },
  "zh-SG": {
    translation: zh_CN,  // Singapore uses Simplified Chinese
  },
  "zh-TW": {
    translation: zh_TW,
  },
  "zh-HK": {
    translation: zh_TW,  // Hong Kong uses Traditional Chinese
  },
  "zh-MO": {
    translation: zh_TW,  // Macau uses Traditional Chinese
  },
};

const i18n = i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "zh-CN",
    interpolation: {
      escapeValue: false, // React handles XSS
    },
    detection: {
      order: ["querystring", "cookie", "localStorage", "navigator", "htmlTag"],
      caches: ["localStorage", "cookie"],
    },
  });

export default i18n;
