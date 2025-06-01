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
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const params = new URLSearchParams(window.location.search);
  const uuid = params.get("uuid");
  const [callout, setCallout] = useState(false);
  const [t] = useTranslation();
  var firstBinary = useRef(false);
  useEffect(() => {
    if (uuid === null) {
      window.location.href = "/";
    }
    fetch("./api/admin/client/list")
      .then((res) => res.json())
      .then((data) => {
        if (data.length === 0) {
          alert(t("terminal.no_active_connection"));
        }
        const client = data.find(
          (item: { uuid: string }) => item.uuid === uuid
        );
        document.title = `${t("terminal.title")} - ${
          client?.name || t("terminal.title")
        }`;
      });
  }, [t, uuid]);
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
    wsRef.current = ws; // 发送终端尺寸
    ws.onopen = () => {
      handleResize(); // 撑满窗口区域
      handleResize(); // resize
      startHeartbeat();
    };

    // 心跳发送
    const startHeartbeat = () => {
      heartbeatIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "heartbeat",
              timestamp: new Date().toISOString(),
            })
          );
        }
      }, 30000);
    };

    // 停止心跳
    const stopHeartbeat = () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };

    // 接收服务器数据
    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        const uint8Array = new Uint8Array(event.data);
        term.write(uint8Array);
      } else {
        term.write(event.data);
      }
      // 建立连接后resize一次
      if (!firstBinary.current && event.data instanceof ArrayBuffer) {
        firstBinary.current = true;
        handleResize();
      }
    }; // 连接关闭
    ws.onclose = () => {
      stopHeartbeat();
      term.write(`\n ${t("terminal.disconnect")}`);
    };

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

    // 处理右键菜单
    const handleContextMenu = (e: MouseEvent) => {
      if (e.ctrlKey || ws.readyState !== WebSocket.OPEN) {
        return;
      }
      const selection = window.getSelection();
      const hasSelection = selection && selection.toString().length > 0;
      if (hasSelection) {
        e.preventDefault();
        const selectedText = selection.toString();
        navigator.clipboard.writeText(selectedText).finally(() => {
          term.focus();
          term.clearSelection();
        });
      } else {
        e.preventDefault();
        term.focus();
        navigator.clipboard.readText().then((text) => {
          const encoder = new TextEncoder();
          const uint8Array = encoder.encode(text);
          ws.send(uint8Array);
        });
      }
    };

    document.addEventListener("contextmenu", handleContextMenu); // 清理函数
    return () => {
      stopHeartbeat();
      term.dispose();
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [t, uuid]);

  return (
    <div className="flex justify-center bg-black md:bg-accent-3 flex-col">
      <div className="flex justify-center items-center fixed top-2 left-auto right-auto w-full z-10">
        <Callout.Root
          hidden={!callout}
          className="mx-auto"
          variant="soft"
          color="red"
        >
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
      <div className="m-0 md:p-4 p-0 w-screen h-screen bg-black">
        <div ref={terminalRef} className="h-full w-full" />
      </div>
    </div>
  );
};

export default TerminalPage;
