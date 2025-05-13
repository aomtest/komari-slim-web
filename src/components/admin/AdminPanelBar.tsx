import { Cross1Icon, ExitIcon, HamburgerMenuIcon } from "@radix-ui/react-icons";
import {
  Button,
  Callout,
  Flex,
  Grid,
  IconButton,
  Strong,
  Text,
} from "@radix-ui/themes";
import { AnimatePresence, motion } from "framer-motion"; // 引入 Framer Motion
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import ColorSwitch from "../ColorSwitch";
import {
  TablerAdjustments,
  TablerServer,
  TablerUserCircle,
  TablerUsers,
} from "../Icones/Tabler";
import LanguageSwitch from "../Language";
import ThemeSwitch from "../ThemeSwitch";

interface AdminPanelBarProps {
  content: ReactNode;
}

const AdminPanelBar = ({ content }: AdminPanelBarProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const ishttps = window.location.protocol === "https:";
  const [t] = useTranslation();
  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // PC 端默认展开侧边栏，移动端默认收起
      setSidebarOpen(!mobile);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 侧边栏动画变体
  const sidebarVariants = {
    open: {
      width: isMobile ? "100vw" : "240px",
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    closed: {
      width: 0,
      opacity: isMobile ? 0 : 1, // 移动端完全透明
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  // 内容区域动画变体
  const contentVariants = {
    open: {
      opacity: isMobile ? 0 : 1,
      x: isMobile ? "100%" : 0,
      transition: {
        duration: 0.3,
      },
    },
    closed: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  function logout() {
    window.open("/api/logout", "_self");
  }
  return (
    <>
      <Grid
        columns={{ initial: "1fr", md: sidebarOpen ? "240px 1fr" : "0px 1fr" }} // 动态调整网格列
        rows={{ initial: "auto 1fr", md: "auto 1fr" }}
        style={{
          height: "100vh",
          width: "100vw",
          overflow: "auto",
          backgroundColor: "var(--accent-3)",
        }}
      >
        {/* Navbar */}
        <motion.nav
          className="col-span-2"
          initial={{ y: 0 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Flex gap="3" p="2" justify="between" align="center">
            <Flex gap="3" align="center">
              <Button
                variant="soft"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ display: isMobile && sidebarOpen ? "none" : "flex" }}
              >
                <HamburgerMenuIcon />
              </Button>
              <Link to="/">
                <Strong>Komari</Strong>
              </Link>
            </Flex>
            <Flex gap="3" align="center">
              <ThemeSwitch />
              <ColorSwitch />
              <LanguageSwitch />
              <IconButton variant="soft" color="orange" onClick={logout}>
                <ExitIcon />
              </IconButton>
            </Flex>
          </Flex>
        </motion.nav>

        {/* Sidebar */}
        <AnimatePresence>
          <motion.div
            variants={sidebarVariants}
            initial="closed"
            animate={sidebarOpen ? "open" : "closed"}
            exit="closed"
            style={{
              backgroundColor: "var(--accent-3)",
              height: "100%",
              position: isMobile ? "absolute" : "relative",
              zIndex: isMobile ? 10 : 1,
              overflowY: "auto",
              overflowX: "hidden", // 防止内容在动画时溢出
            }}
          >
            {/* 关闭按钮 */}
            <Flex
              gap="3"
              p="4"
              direction="column"
              justify="start"
              align="start"
              style={{ height: "100%", minWidth: "240px" }} // 确保内容区域有最小宽度
            >
              <IconButton
                variant="soft"
                style={{ display: isMobile ? "flex" : "none" }}
                onClick={() => setSidebarOpen(false)}
              >
                <Cross1Icon />
              </IconButton>
              {/* 侧边连链接 */}
              <Flex
                direction="column"
                gap={{ md: "2", initial: "2" }}
                justify={{ md: "start", initial: "start" }}
                className="h-full md:mt-0 mt-6"
                style={{ width: "100%" }}
              >
                <SidebarItem
                  to="/admin"
                  icon={<TablerServer />}
                  children={t("server")}
                  onClick={() => isMobile && setSidebarOpen(false)}
                />
                <SidebarItem
                  to="/admin/settings"
                  icon={<TablerAdjustments />}
                  children={t("settings")}
                  onClick={() => isMobile && setSidebarOpen(false)}
                />
                <SidebarItem
                  to="/admin/sessions"
                  icon={<TablerUsers />}
                  children={t("sessions")}
                  onClick={() => isMobile && setSidebarOpen(false)}
                />
                <SidebarItem
                  to="/admin/account"
                  icon={<TablerUserCircle />}
                  children={t("account")}
                  onClick={() => isMobile && setSidebarOpen(false)}
                />
              </Flex>
            </Flex>
          </motion.div>
        </AnimatePresence>

        {/* Main Content */}
        <motion.div
          variants={contentVariants}
          animate={sidebarOpen ? "open" : "closed"}
          style={{
            backgroundColor: "var(--accent-3)",
            display: isMobile && sidebarOpen ? "none" : "block",
            height: "100%", // Ensure the container takes full height
            overflow: "hidden", // Prevent this container from scrolling
          }}
        >
          <div
            style={{
              backgroundColor: "var(--accent-1)",
              height: "100%",
              borderRadius: "8px 8px 0 0",
              padding: "16px",
              overflowY: "auto",
              boxSizing: "border-box",
            }}
          >
            <Callout.Root mb="2" hidden={ishttps} color="red">
              <Callout.Icon>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M10.03 3.659c.856-1.548 3.081-1.548 3.937 0l7.746 14.001c.83 1.5-.255 3.34-1.969 3.34H4.254c-1.715 0-2.8-1.84-1.97-3.34zM12.997 17A.999.999 0 1 0 11 17a.999.999 0 0 0 1.997 0m-.259-7.853a.75.75 0 0 0-1.493.103l.004 4.501l.007.102a.75.75 0 0 0 1.493-.103l-.004-4.502z"
                  />
                </svg>
              </Callout.Icon>
              <Callout.Text>
                <Text size="2" weight="medium">
                  {t("warn_https")}
                </Text>
              </Callout.Text>
            </Callout.Root>
            {content}
          </div>
        </motion.div>
      </Grid>
    </>
  );
};

export default AdminPanelBar;

// 侧边栏项目组件
const SidebarItem = ({
  to,
  onClick,
  icon,
  children,
}: {
  to: string;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) => {
  const location = useLocation();
  const isActive =
    location.pathname === to ||
    (to !== "/admin" && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      onClick={onClick}
      className="hover:bg-accent-5 rounded-sm transition-all duration-200"
    >
      <Flex
        px="3"
        py="2"
        style={{
          display: "flex",
          justifyContent: "start",
          alignItems: "center",
          gap: "8px",
          borderRadius: "6px",
          backgroundColor: isActive ? "var(--accent-6)" : "transparent",
          transition: "all 0.2s ease",
        }}
      >
        <span
          style={{
            color: isActive ? "var(--accent-12)" : "inherit",
            opacity: isActive ? 1 : 0.7,
          }}
        >
          {icon}
        </span>
        <Text
          size="3"
          weight={isActive ? "bold" : "medium"}
          style={{
            color: isActive ? "var(--accent-12)" : "inherit",
          }}
        >
          {children}
        </Text>
        {isActive && (
          <div
            className="ml-auto h-4 w-1 rounded-sm"
            style={{
              backgroundColor: "var(--accent-9)",
            }}
          />
        )}
      </Flex>
    </Link>
  );
};
