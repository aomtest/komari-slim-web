import { DropdownMenu, IconButton } from "@radix-ui/themes";
import { useContext, type ReactNode } from "react";
import { ThemeContext } from "../contexts/ThemeContext";
import { SunIcon } from "@radix-ui/react-icons";

interface ThemeSwitchProps {
  icon?: ReactNode;
  content?: {
    light?: ReactNode;
    dark?: ReactNode;
    system?: ReactNode;
  };
}

const ThemeSwitch = ({
  icon = (
    <IconButton variant="soft">
      <SunIcon />
    </IconButton>
  ),
  content = {
    light: "Light",
    dark: "Dark",
    system: "System",
  },
}: ThemeSwitchProps = {}) => {
  const { setAppearance } = useContext(ThemeContext);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>{icon}</DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item onSelect={() => setAppearance("light")}>
          {content.light}
        </DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setAppearance("dark")}>
          {content.dark}
        </DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setAppearance("inherit")}>
          {content.system}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default ThemeSwitch;
