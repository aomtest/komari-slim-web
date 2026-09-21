import { Flex, Text } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { useRPC2Call } from "@/contexts/RPC2Context";
import { usePublicInfo } from "@/contexts/PublicInfoContext";

const Footer = () => {
  //const currentYear = new Date().getFullYear();

  // 格式化 build 时间
  const formatBuildTime = (isoString: string) => {
    const date = new Date(isoString);
    return (
      date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Shanghai",
      }) + " (GMT+8)"
    );
  };

  const buildTime =
    typeof __BUILD_TIME__ !== "undefined" ? __BUILD_TIME__ : null;
  const [versionInfo, setVersionInfo] = useState<{
    hash: string;
    version: string;
  } | null>(null);
  const { call } = useRPC2Call();
  const { publicInfo } = usePublicInfo();
  const customFooterHtml = publicInfo?.theme_settings?.customFooterHtml || "";
  useEffect(() => {
    const fetchVersionInfo = async () => {
      try {
        //const response = await fetch('/api/version');
        const data = await call("common:getVersion");
        setVersionInfo({ hash: data.hash?.slice(0, 7), version: data.version });
      } catch (error) {
        console.error("Failed to fetch version info:", error);
      }
    };

    fetchVersionInfo();
  }, []);

  return (
    <div className="km-footer footer p-2 px-4 border-t-1 border-t-[var(--gray-7)]">
      {/* Copyright and ICP Filing */}

      {customFooterHtml ? (
        <Text
          size="1"
          color="gray"
          className="flex flex-col justify-center items-center"
        >
          <span
            dangerouslySetInnerHTML={{
              __html: customFooterHtml,
            }}
          ></span>
          <Text size="2" color="gray">
            Powered by komari-slim.
          </Text>
        </Text>
      ) : (
        // 左对齐：内层原本带 maxWidth:1200px + margin:auto（居中的 1200px 容器），
        // 在宽屏上会把这段文字推到页面中间（1780 视口下 x=290），
        // 与满宽的导航/内容对不齐，故去掉居中约束，靠 px-4 与导航品牌左边界对齐。
        <Flex
          direction={{ initial: "column", md: "row" }}
          justify="between"
          align={{ initial: "center", md: "start" }}
          gap="4"
        >
          <Flex
            direction="column"
            gap="2"
            align={{ initial: "center", md: "start" }}
          >
            <Text size="2" color="gray">
              Powered by komari-slim.
            </Text>
            {buildTime && (
              <Text size="1" color="gray">
                Build Time: {formatBuildTime(buildTime)}
              </Text>
            )}
            <Text size="1" color="gray">
              {versionInfo && `${versionInfo.version} (${versionInfo.hash})`}
            </Text>
          </Flex>
        </Flex>
      )}
    </div>
  );
};

export default Footer;
