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
    <div className="km-footer footer p-2 border-t-1 border-t-[var(--gray-7)]">
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
        // 整体居中：外层只有一个子元素，justify/align 都取 center，
        // 内层三行也居中对齐。
        // 历史：上游在内层加了 maxWidth:1200px + margin:auto，于是宽屏下这段文字
        // 会被推到页面中间偏左（1780 视口下 x=290）；曾改成左对齐，现按使用者要求
        // 回到完全居中。
        <Flex
          direction={{ initial: "column", md: "row" }}
          justify="center"
          align="center"
          gap="4"
        >
          <Flex direction="column" gap="2" align="center">
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
