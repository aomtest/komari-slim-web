import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";

interface TipsProps {
  size?: string;
  children?: React.ReactNode;
}

const Tips: React.FC<TipsProps> = ({ size = "16", children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
      {isOpen && (
        <motion.div
          className={`absolute z-10 top-full mt-2 left-1/2 -translate-x-1/2 bg-[var(--gray-4)] rounded-md p-1 text-sm min-w-48`}
          variants={popupVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="relative">
            {children}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Tips;
