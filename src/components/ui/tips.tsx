import React, { useState } from "react";
import { Info } from "lucide-react";
import { Popover } from "@radix-ui/themes";
import { useIsMobile } from "@/hooks/use-mobile";

interface TipsProps {
  size?: string;
  color?: string;
  children?: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}

const Tips: React.FC<TipsProps & React.HTMLAttributes<HTMLDivElement>> = ({
  size = "16",
  color = "gray",
  children,
  side = "bottom",
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleInteraction = () => {
    if (isMobile) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative inline-block" {...props}>
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger>
          <div
            className={`flex items-center justify-center rounded-full font-bold cursor-pointer `}
            onClick={isMobile ? handleInteraction : undefined}
            onMouseEnter={!isMobile ? () => setIsOpen(true) : undefined}
            onMouseLeave={!isMobile ? () => setIsOpen(false) : undefined}
          >
            <Info color={color} size={size} />
          </div>
        </Popover.Trigger>
        <Popover.Content
          side={side}
          sideOffset={5}
          onMouseEnter={!isMobile ? () => setIsOpen(true) : undefined}
          onMouseLeave={!isMobile ? () => setIsOpen(false) : undefined}
          style={{
            padding: "0.5rem",
            border: "none",
            boxShadow:
              "hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px",
            borderRadius: "var(--radius-3)",
            zIndex: 5,
            minWidth: isMobile ? "12rem" : "16rem",
            maxWidth: isMobile ? "80vw" : "16rem",
            backgroundColor: "var(--accent-3)",
            color: "var(--gray-12)",
          }}
        >
          <div className="relative text-sm">{children}</div>
        </Popover.Content>
      </Popover.Root>
    </div>
  );
};

export default Tips;
