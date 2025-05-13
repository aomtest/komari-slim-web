import { DropdownMenu, IconButton, Text } from "@radix-ui/themes";
import { useContext, type ReactNode } from "react";
import { ThemeContext } from "../contexts/ThemeContext";
import { BlendingModeIcon } from "@radix-ui/react-icons";
import { useTranslation } from "react-i18next";

interface ColorSwitchProps {
  icon?: ReactNode;
}

const ColorSwitch = ({ 
  icon = (
    <IconButton variant="soft">
      <BlendingModeIcon />
    </IconButton>
  ),
}: ColorSwitchProps = {}) => {
  const { setColor } = useContext(ThemeContext);
  const { t } = useTranslation();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
          {icon}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item onSelect={() => setColor("gray")}><Text color="gray">{t('color_gray')}</Text></DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setColor("gold")}><Text color="gold">{t('color_gold')}</Text></DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setColor("bronze")}><Text color="bronze">{t('color_bronze')}</Text></DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setColor("brown")}><Text color="brown">{t('color_brown')}</Text></DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setColor("yellow")}><Text color="yellow">{t('color_yellow')}</Text></DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setColor("amber")}><Text color="amber">{t('color_amber')}</Text></DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setColor("orange")}><Text color="orange">{t('color_orange')}</Text></DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setColor("tomato")}><Text color="tomato">{t('color_tomato')}</Text></DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setColor("red")}><Text color="red">{t('color_red')}</Text></DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setColor("ruby")}><Text color="ruby">{t('color_ruby')}</Text></DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setColor("crimson")}><Text color="crimson">{t('color_crimson')}</Text></DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setColor("pink")}><Text color="pink">{t('color_pink')}</Text></DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setColor("plum")}><Text color="plum">{t('color_plum')}</Text></DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setColor("purple")}><Text color="purple">{t('color_purple')}</Text></DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setColor("violet")}><Text color="violet">{t('color_violet')}</Text></DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setColor("iris")}><Text color="iris">{t('color_iris')}</Text></DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setColor("indigo")}><Text color="indigo">{t('color_indigo')}</Text></DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setColor("blue")}><Text color="blue">{t('color_blue')}</Text></DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setColor("cyan")}><Text color="cyan">{t('color_cyan')}</Text></DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setColor("teal")}><Text color="teal">{t('color_teal')}</Text></DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setColor("jade")}><Text color="jade">{t('color_jade')}</Text></DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setColor("green")}><Text color="green">{t('color_green')}</Text></DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setColor("grass")}><Text color="grass">{t('color_grass')}</Text></DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setColor("lime")}><Text color="lime">{t('color_lime')}</Text></DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setColor("mint")}><Text color="mint">{t('color_mint')}</Text></DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setColor("sky")}><Text color="sky">{t('color_sky')}</Text></DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default ColorSwitch;
