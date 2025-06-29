import React, { useState } from "react";
import { Info } from "lucide-react";
import { Button, Dialog, Popover } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";

interface TipsProps {
  size?: string;
  color?: string;
  children?: React.ReactNode;
}

const Tips: React.FC<TipsProps> = ({
  size = "16",
  color = "gray",
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const [t] = useTranslation();

  const handleInteraction = () => {
    if (isMobile) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative inline-block">
      {isMobile ? (
        <>
          <div
            className={`flex items-center justify-center rounded-full font-bold cursor-pointer `}
            onClick={handleInteraction}
          >
            <Info size={size} />
          </div>
          <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            <Dialog.Content>
              <Dialog.Title>Tips</Dialog.Title>
              <div className="flex flex-col gap-2">{children}</div>
              <Dialog.Close>
                <div className="flex justify-end mt-4">
                  <Button>{t("common.close")}</Button>
                </div>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Root>
        </>
      ) : (
        <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
          <Popover.Trigger>
            <div
              className={`flex items-center justify-center rounded-full font-bold cursor-pointer `}
              onMouseEnter={() => setIsOpen(true)}
              onMouseLeave={() => setIsOpen(false)}
            >
              <Info color={color} size={size} />
            </div>
          </Popover.Trigger>
          <Popover.Content
            sideOffset={5}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
            style={{
              padding: "0.5rem",
              border: "none",
              boxShadow:
                "hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px",
              borderRadius: "var(--radius-3)",
              zIndex: 5,
              minWidth: "16rem",
              backgroundColor: "var(--accent-3)",
              color: "var(--gray-12)",
            }}
          >
            <div className="relative text-sm">{children}</div>
          </Popover.Content>
        </Popover.Root>
      )}
    </div>
  );
};

export default Tips;
