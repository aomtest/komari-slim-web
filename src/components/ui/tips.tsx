import React, { useState } from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { Button, Dialog } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";

interface TipsProps {
  size?: string;
  children?: React.ReactNode;
}

const Tips: React.FC<TipsProps> = ({ size = "16", children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const [t] = useTranslation();

  const handleInteraction = () => {
    if (isMobile) {
      setIsOpen(!isOpen);
    }
  };

  // Animation variants for the popup
  const popupVariants = {
    hidden: { opacity: 0, y: -4 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="relative inline-block">
      <div
        className={`flex items-center justify-center rounded-full font-bold cursor-pointer `}
        onClick={handleInteraction}
        onMouseEnter={() => !isMobile && setIsOpen(true)}
        onMouseLeave={() => !isMobile && setIsOpen(false)}
      >
        <Info size={size} />
      </div>
      {isMobile ? (
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
      ) : (
        isOpen && (
          <motion.div
            className={`absolute z-10 top-full mt-2 left-1/2 -translate-x-1/2 bg-[var(--accent-3)] border-2 border-accent-5 rounded-md p-1 text-sm min-w-64`}
            variants={popupVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="relative">{children}</div>
          </motion.div>
        )
      )}
    </div>
  );
};

export default Tips;
