import { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import { SearchAddon } from "xterm-addon-search";
import "xterm/css/xterm.css";
import "./Terminal.css";
import { Callout, Flex, IconButton } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { Cross1Icon } from "@radix-ui/react-icons";
import { TablerAlertTriangleFilled } from "../../components/Icones/Tabler";

const TerminalPage = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const params = new URLSearchParams(window.location.search);
  const uuid = params.get("uuid");
  const [callout, setCallout] = useState(false);
  const [t] = useTranslation();
  useEffect(() => {
    setCallout(window.location.protocol !== "https:");
    // 初始化终端
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      macOptionIsMeta: true,
      scrollback: 5000,
      convertEol: true,
      fontFamily: "'Cascadia Mono', 'Noto Sans SC', monospace",
      fontSize: 16,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    const searchAddon = new SearchAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.loadAddon(searchAddon);

    term.open(terminalRef.current);
    terminalInstance.current = term;

    // 连接WebSocket
    const ws = new WebSocket(`./api/admin/client/${uuid}/terminal`);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    // 发送终端尺寸
    ws.onopen = () => {
      fitAddon.fit();
      const dimensions = { cols: term.cols, rows: term.rows };
      ws.send(
        JSON.stringify({
          type: "resize",
          cols: dimensions.cols,
          rows: dimensions.rows,
        })
      );
    };

    // 接收服务器数据
    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        const uint8Array = new Uint8Array(event.data);
        term.write(uint8Array);
      } else {
        term.write(event.data);
      }
    };

    // 连接关闭
    ws.onclose = () => term.write("\nConnection closed");

    // 处理用户输入并发送到服务器
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        const encoder = new TextEncoder();
        const uint8Array = encoder.encode(data);
        ws.send(uint8Array);
      }
    });

    // 处理窗口大小变化
    const handleResize = () => {
      fitAddon.fit();
      // 发送新的尺寸到服务器
      const dimensions = { cols: term.cols, rows: term.rows };
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "resize",
            cols: dimensions.cols,
            rows: dimensions.rows,
          })
        );
      }
    };
    window.addEventListener("resize", handleResize);

    // 处理搜索快捷键
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        if (e.key === "f" || e.key === "d") {
          searchAddon.findNext("");
          e.preventDefault();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    // 清理函数
    return () => {
      term.dispose();
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="flex justify-center bg-black flex-col">
      <div className="flex justify-center items-center fixed top-2 left-auto right-auto w-full z-10">
        <Callout.Root hidden={!callout} className="mx-auto" variant="soft" color="red">
          <Callout.Icon>
            <TablerAlertTriangleFilled />
          </Callout.Icon>
          <Callout.Text>
            <Flex align="center">
              <span>{t("warn_https")}</span>
              <IconButton
                variant="ghost"
                size="1"
                className="ml-4"
                onClick={() => {
                  setCallout(false);
                }}
              >
                <Cross1Icon />
              </IconButton>
            </Flex>
          </Callout.Text>
        </Callout.Root>
      </div>
      <div
        ref={terminalRef}
        className="h-screen w-screen"
      />
    </div>
  );
};

export default TerminalPage;
