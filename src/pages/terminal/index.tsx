import { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import { SearchAddon } from "xterm-addon-search";
import "xterm/css/xterm.css";
import "./Terminal.css";
import { Callout, Flex, IconButton, Theme } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { Cross1Icon } from "@radix-ui/react-icons";
import { TablerAlertTriangleFilled } from "../../components/Icones/Tabler";
import CommandClipboardPanel from "@/pages/terminal/CommandClipboard";
import type { TFunction } from "i18next";
import { Toaster } from "sonner";
import { TerminalContext } from '@/contexts/TerminalContext';

// TerminalArea: 主终端区域组件，包含 callout、终端容器 与 开关按钮
interface TerminalAreaProps {
  terminalRef: React.RefObject<HTMLDivElement | null>;
  callout: boolean;
  setCallout: (b: boolean) => void;
  toggleClipboard: () => void;
  width: number | string;
  t: TFunction;
  isOpen: boolean;
}
const TerminalArea: React.FC<TerminalAreaProps> = ({
  terminalRef,
  callout,
  setCallout,
  toggleClipboard,
  width,
  t,
  isOpen,
}) => (
  <div
    className="relative flex justify-center bg-black md:bg-accent-3 flex-col h-full min-w-128"
    style={{ width }}
  >
    <div className="flex justify-center items-center fixed top-2 left-auto right-auto z-10">
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
    <div className="m-0 md:p-4 p-0 w-full h-full bg-black">
      <div ref={terminalRef} className="h-full w-full" />
    </div>
    <div
      className="absolute right-0 top-1/2 transform -translate-y-1/2 flex items-center justify-center bg-accent-4 hover:bg-accent-6 text-white cursor-pointer rounded-l-full w-6 h-12 z-20"
      onClick={toggleClipboard}
    >
      {isOpen ? ">" : "<"}
    </div>
  </div>
);

// Divider: 拖拽分隔线组件
const Divider: React.FC<{ onMouseDown: () => void }> = ({ onMouseDown }) => (
  <div
    className="h-full bg-accent-2 cursor-col-resize"
    style={{ width: 4 }}
    onMouseDown={onMouseDown}
  />
);

// ClipboardPanel: 右侧面板组件
const ClipboardPanel: React.FC = () => (
  <div className="h-screen p-2 min-w-64" style={{ flex: 1 }}>
    <CommandClipboardPanel className="h-full w-full" />
  </div>
);

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
  const [isClipboardOpen, setIsClipboardOpen] = useState(false);
  // 添加分隔线相关状态和函数
  const [leftWidth, setLeftWidth] = useState<number>(window.innerWidth * 0.7);
  const draggingRef = useRef(false);
  const fitAddonRef = useRef<any>(null);

  const resizeTerminal = () => {
    fitAddonRef.current?.fit();
    const term = terminalInstance.current;
    const ws = wsRef.current;
    if (term && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "resize",
          cols: term.cols,
          rows: term.rows,
        })
      );
    }
  };

  const startDragging = () => {
    draggingRef.current = true;
  };
  const stopDragging = () => {
    if (draggingRef.current) {
      draggingRef.current = false;
      resizeTerminal();
    }
  };
  const onMouseMove = (e: MouseEvent) => {
    if (draggingRef.current) {
      setLeftWidth(e.clientX);
    }
  };

  useEffect(() => {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", stopDragging);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", stopDragging);
    };
  }, []);

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
    fitAddonRef.current = fitAddon;
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
        setTimeout(() => {
          const term = terminalInstance.current;
          if (term) {
            term.resize(term.cols - 1, term.rows);
          }
          handleResize();
        }, 200); // 延时200毫秒resize渲染，不然总有奇奇怪怪的渲染bug
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
          const uint8Array = encoder.encode(text.replace(/\r?\n/g, "\r"));
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

  // 当右侧面板开关变化时，触发终端 resize
  useEffect(() => {
    if (!fitAddonRef.current) return;
    resizeTerminal();
  }, [isClipboardOpen]);

  // Provide sendCommand to children via context
  const sendCommand = (cmd: string) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      const encoder = new TextEncoder();
      ws.send(encoder.encode(cmd + "\r"));
    }
  };

  return (
    <TerminalContext.Provider value={{ terminal: terminalInstance.current, sendCommand }}>
      <Theme appearance="dark">
        <Toaster theme="dark" />
        <Flex className="h-screen w-screen" direction="row">
          <TerminalArea
            terminalRef={terminalRef}
            callout={callout}
            setCallout={setCallout}
            toggleClipboard={() => setIsClipboardOpen(!isClipboardOpen)}
            width={isClipboardOpen ? leftWidth : "100%"}
            t={t}
            isOpen={isClipboardOpen}
          />
          {isClipboardOpen && <Divider onMouseDown={startDragging} />}
          {isClipboardOpen && <ClipboardPanel />}
        </Flex>
      </Theme>
    </TerminalContext.Provider>
  );
};

export default TerminalPage;
