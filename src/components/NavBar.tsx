import ThemeSwitch from "./ThemeSwitch";
import ColorSwitch from "./ColorSwitch";
import LanguageSwitch from "./Language";
import LoginDialog from "./Login";
import { IconButton } from "@radix-ui/themes";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
const NavBar = () => {
  return (
    <nav className="flex rounded-b-lg items-center gap-3 max-h-16 justify-end min-w-full p-2">
      <div className="mr-auto flex">
        <label className="text-3xl font-bold ">Komari</label>
        <div className="hidden flex-row items-end md:flex">
          <div
            style={{ color: "var(--accent-3)" }}
            className="border-solid border-r-2 mr-1 mb-1 w-2 h-2/3"
          />
          <label
            className="text-base font-bold"
            style={{ color: "var(--accent-4)" }}
          >
            Komari Monitor
          </label>
        </div>
      </div>
      {process.env.NODE_ENV == "development" && (
        <IconButton
          variant="soft"
          onClick={() => {
            window.open("https://github.com/komari-monitor", "_blank");
          }}
        >
          <GitHubLogoIcon />
        </IconButton>
      )}
      <ThemeSwitch />
      <ColorSwitch />
      <LanguageSwitch />
      <LoginDialog />
    </nav>
  );
};
export default NavBar;
