import {
  Button,
  DropdownMenu,
  Flex,
  IconButton,
  Switch,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import React from "react";
import { useTranslation } from "react-i18next";

interface SettingCardProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  direction?: "row" | "column" | "row-reverse" | "column-reverse";
}

export function SettingCard({
  title = "",
  description = "",
  children,
  className = "",
  direction = "column",
}: SettingCardProps) {
  const actionChild = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === Action
  );

  const otherChildren = React.Children.toArray(children).filter(
    (child) => !(React.isValidElement(child) && child.type === Action)
  );

  return (
    <Flex
      direction={direction}
      justify="between"
      align="center"
      wrap="wrap"
      style={{ borderColor: "var(--gray-a7)" }}
      className={
        "border-1 rounded-lg py-2 px-4 bg-[var(--gray-2)] gap-4 min-h-8" +
        className
      }
    >
      <Flex
        className="w-full"
        direction="row"
        justify="between"
        align="center"
        wrap="nowrap"
      >
        <Flex direction="column" gap="1" className="min-h-10">
          <label className="text-base font-medium" style={{ fontWeight: 600 }}>
            {title}
          </label>
          <label className="text-sm text-muted-foreground">{description}</label>
        </Flex>
        {actionChild}
      </Flex>
      {otherChildren}
    </Flex>
  );
}

function Action({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

SettingCard.Action = Action;

export function SettingCardSwitch({
  title = "",
  description = "",
  label = "",
  autoDisabled = true,
  defaultChecked,
  onChange,
}: {
  title?: string;
  description?: string;
  label?: string;
  autoDisabled?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean, switchElement: HTMLButtonElement) => void;
}) {
  const switchRef = React.useRef<HTMLButtonElement>(null);
  const [disabled, setDisabled] = React.useState(false);

  const handleChange = (checked: boolean) => {
    if (autoDisabled) setDisabled(true);
    const result: any = onChange && switchRef.current ? onChange(checked, switchRef.current) : undefined;
    if (autoDisabled) {
      const promise: Promise<any> = result;
      if (promise && typeof promise.then === 'function') {
        promise.finally(() => setDisabled(false));
      } else {
        setDisabled(false);
      }
    }
  };

  return (
    <SettingCard title={title} description={description} direction="column">
      <SettingCard.Action>
        <Flex direction="row" gap="2" align="center">
          <label>{label}</label>
          <Switch
            ref={switchRef}
            defaultChecked={defaultChecked}
            onCheckedChange={handleChange}
            disabled={disabled}
          />
        </Flex>
      </SettingCard.Action>
    </SettingCard>
  );
}

export function SettingCardButton({
  title = "",
  description = "",
  label = "",
  variant = "solid",
  children,
  onClick,
  autoDisabled = true,
}: {
  title?: string;
  description?: string;
  label?: string;
  variant?: "solid" | "soft" | "outline" | "ghost";
  children?: React.ReactNode;
  onClick?: (buttonElement: HTMLButtonElement) => void;
  autoDisabled?: boolean;
}) {
  const [disabled, setDisabled] = React.useState(false);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (autoDisabled) setDisabled(true);
    const result: any = onClick ? onClick(event.currentTarget) : undefined;
    if (autoDisabled) {
      const promise: Promise<any> = result;
      if (promise && typeof promise.then === 'function') {
        promise.finally(() => setDisabled(false));
      } else {
        setDisabled(false);
      }
    }
  };

  return (
    <SettingCard title={title} description={description} direction="column">
      <SettingCard.Action>
        <Flex>
          <Flex direction="row" gap="2" align="center">
            <label>{label}</label>
            <Button onClick={handleClick} variant={variant} disabled={disabled}>
              {children}
            </Button>
          </Flex>
        </Flex>
      </SettingCard.Action>
    </SettingCard>
  );
}

export function SettingCardIconButton({
  title = "",
  description = "",
  label = "",
  variant = "solid",
  children,
  onClick,
  autoDisabled = true,
}: {
  title?: string;
  description?: string;
  label?: string;
  variant?: "solid" | "soft" | "outline" | "ghost";
  children?: React.ReactNode;
  onClick?: (buttonElement: HTMLButtonElement) => void;
  autoDisabled?: boolean;
}) {
  const [disabled, setDisabled] = React.useState(false);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (autoDisabled) setDisabled(true);
    const result: any = onClick ? onClick(event.currentTarget) : undefined;
    if (autoDisabled) {
      const promise: Promise<any> = result;
      if (promise && typeof promise.then === 'function') {
        promise.finally(() => setDisabled(false));
      } else {
        setDisabled(false);
      }
    }
  };

  return (
    <SettingCard title={title} description={description} direction="column">
      <SettingCard.Action>
        <Flex>
          <Flex direction="row" gap="2" align="center">
            <label>{label}</label>
            <IconButton onClick={handleClick} variant={variant} disabled={disabled}>
              {children}
            </IconButton>
          </Flex>
        </Flex>
      </SettingCard.Action>
    </SettingCard>
  );
}

export function SettingCardShortTextInput({
  title = "",
  description = "",
  label = useTranslation().t("save"),
  defaultValue = "",
  OnSave = () => {},
  autoDisabled = true,
}: {
  title?: string;
  description?: string;
  label?: string;
  defaultValue?: string;
  OnSave?: (
    value: string,
    inputElement: HTMLInputElement,
    buttonElement: HTMLButtonElement
  ) => void;
  autoDisabled?: boolean;
}) {
  const [disabled, setDisabled] = React.useState(false);
  const [value, setValue] = React.useState(defaultValue);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handleSave = () => {
    if (autoDisabled) setDisabled(true);
    const result: any = inputRef.current && buttonRef.current
      ? OnSave(value, inputRef.current, buttonRef.current)
      : undefined;
    if (autoDisabled) {
      const promise: Promise<any> = result;
      if (promise && typeof promise.then === 'function') {
        promise.finally(() => setDisabled(false));
      } else {
        setDisabled(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  return (
    <SettingCard title={title} description={description}>
      <SettingCard.Action>
        <Flex>
          <Flex direction="row" gap="2" align="center">
            <Button ref={buttonRef} onClick={handleSave} variant="solid" disabled={disabled}>
              {label}
            </Button>
          </Flex>
        </Flex>
      </SettingCard.Action>
      <TextField.Root
        className="w-full"
        defaultValue={defaultValue}
        value={value}
        onChange={handleInputChange}
        ref={inputRef}
      />
    </SettingCard>
  );
}

export function SettingCardLongTextInput({
  title = "",
  description = "",
  label = useTranslation().t("save"),
  defaultValue = "",
  OnSave = () => {},
  autoDisabled = true,
}: {
  title?: string;
  description?: string;
  label?: string;
  defaultValue?: string;
  OnSave?: (
    value: string,
    textAreaElement: HTMLTextAreaElement,
    buttonElement: HTMLButtonElement
  ) => void;
  autoDisabled?: boolean;
}) {
  const [disabled, setDisabled] = React.useState(false);
  const [value, setValue] = React.useState(defaultValue);
  const textAreaRef = React.useRef<HTMLTextAreaElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handleSave = () => {
    if (autoDisabled) setDisabled(true);
    const result: any = textAreaRef.current && buttonRef.current
      ? OnSave(value, textAreaRef.current, buttonRef.current)
      : undefined;
    if (autoDisabled) {
      const promise: Promise<any> = result;
      if (promise && typeof promise.then === 'function') {
        promise.finally(() => setDisabled(false));
      } else {
        setDisabled(false);
      }
    }
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  return (
    <SettingCard title={title} description={description}>
      <SettingCard.Action>
        <Flex>
          <Flex direction="row" gap="2" align="center">
            <Button ref={buttonRef} onClick={handleSave} variant="solid" disabled={disabled}>
              {label}
            </Button>
          </Flex>
        </Flex>
      </SettingCard.Action>
      <TextArea
        className="w-full"
        defaultValue={defaultValue}
        resize="vertical"
        value={value}
        onChange={handleTextAreaChange}
        ref={textAreaRef}
      />
    </SettingCard>
  );
}

export function SettingCardSelect({
  title,
  description,
  defaultValue = "",
  label = useTranslation().t("select"),
  options = [],
  OnSave = () => {},
  autoDisabled = true,
}: {
  title?: string;
  description?: string;
  defaultValue?: string;
  label?: string;
  options?: { value: string; label?: string; disabled?: boolean }[];
  OnSave?: (value: string, buttonElement: HTMLButtonElement) => void;
  autoDisabled?: boolean;
}) {
  const [disabled, setDisabled] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(defaultValue);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  
  const handleSave = (value: string) => {
    if (autoDisabled) setDisabled(true);
    const previousValue = selectedValue; // 保存之前的值
    setSelectedValue(value); // 先更新选择的值
    
    const result: any = buttonRef.current ? OnSave(value, buttonRef.current) : undefined;
    if (autoDisabled) {
      const promise: Promise<any> = result;
      if (promise && typeof promise.then === 'function') {
        promise
          .then(() => {
            // 成功时不需要额外操作，值已经更新
          })
          .catch(() => {
            // 错误时自动切换回之前的值
            setSelectedValue(previousValue);
          })
          .finally(() => {
            setDisabled(false);
          });
      } else {
        setDisabled(false);
      }
    }
  };

  // 获取要显示的文本，优先显示选择的值对应的标签
  const getDisplayText = () => {
    if (selectedValue) {
      const selectedOption = options.find(option => option.value === selectedValue);
      return selectedOption?.label || selectedValue;
    }
    return label;
  };

  return (
    <SettingCard title={title} description={description}>
      <SettingCard.Action>
        <Flex>
          <Flex direction="row" gap="2" align="center">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger disabled={disabled}>
                <Button variant="soft" ref={buttonRef}>
                  {getDisplayText()}
                  <DropdownMenu.TriggerIcon />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                {options.map((option) => (
                  <DropdownMenu.Item
                    disabled={option.disabled}
                    key={option.value}
                    onSelect={() => {
                      handleSave(option.value);
                    }}
                  >
                    {option.label ? option.label : option.value}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </Flex>
        </Flex>
      </SettingCard.Action>
    </SettingCard>
  );
}
