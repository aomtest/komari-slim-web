import { StrictMode, useMemo } from "react";
import { createRoot } from "react-dom/client";
import "./global.css";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import {
  ThemeContext,
  THEME_DEFAULTS,
  type Appearance,
  type Colors,
} from "./contexts/ThemeContext";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { BrowserRouter } from "react-router-dom";
import "./i18n/config"; // Import i18next config
import { Suspense } from "react";
import { useRoutes } from "react-router-dom";
import { routes } from "./routes";
const App = () => {
  const [appearance, setAppearance] = useLocalStorage<Appearance>(
    "appearance",
    THEME_DEFAULTS.appearance
  );
  const [color, setColor] = useLocalStorage<Colors>(
    "color",
    THEME_DEFAULTS.color
  );
  const themeContextValue = useMemo(
    () => ({
      appearance,
      setAppearance,
      color,
      setColor,
    }),
    [appearance, setAppearance, color, setColor]
  );
  const routing = useRoutes(routes);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ThemeContext.Provider value={themeContextValue}>
        <Theme appearance={appearance} accentColor={color} scaling="110%">
          {routing}
        </Theme>
      </ThemeContext.Provider>
    </Suspense>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
