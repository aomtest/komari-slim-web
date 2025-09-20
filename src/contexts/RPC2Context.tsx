import React, { createContext, useContext, useEffect, useState } from "react";
import { RPC2Client } from "../lib/rpc2";
import type { RPC2ConnectionStateType } from "../types/rpc2";

interface RPC2ContextType {
  client: RPC2Client;
  connectionState: RPC2ConnectionStateType;
  isConnected: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const RPC2Context = createContext<RPC2ContextType | undefined>(undefined);

export const RPC2Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 创建客户端实例，默认启用自动连接
  const [client] = useState(() => new RPC2Client("/api/rpc2", { autoConnect: true }));
  const [connectionState, setConnectionState] = useState(client.state);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 设置事件监听器
    client.setEventListeners({
      onConnect: () => {
        setConnectionState(client.state);
        setError(null);
      },
      onDisconnect: () => {
        setConnectionState(client.state);
      },
      onError: (err) => {
        setError(err.message);
        setConnectionState(client.state);
      },
      onReconnecting: (attempt) => {
        setConnectionState(client.state);
        console.log(`RPC2 重连尝试 ${attempt}`);
      },
      onMessage: (data) => {
        // 可以在这里处理全局消息
        console.debug("RPC2 消息:", data);
      },
    });

    // 清理函数
    return () => {
      client.disconnect();
    };
  }, [client]);

  const connect = async () => {
    try {
      setError(null);
      await client.connect();
    } catch (err) {
      setError(err instanceof Error ? err.message : "连接失败");
      throw err;
    }
  };

  const disconnect = () => {
    client.disconnect();
  };

  const isConnected = connectionState === "connected";

  return (
    <RPC2Context.Provider 
      value={{ 
        client, 
        connectionState, 
        isConnected, 
        error, 
        connect, 
        disconnect 
      }}
    >
      {children}
    </RPC2Context.Provider>
  );
};

export const useRPC2 = (): RPC2ContextType => {
  const context = useContext(RPC2Context);
  if (context === undefined) {
    throw new Error("useRPC2 必须在 RPC2Provider 内使用");
  }
  return context;
};

// 自定义 Hook 用于调用 RPC 方法
export const useRPC2Call = () => {
  const { client, isConnected } = useRPC2();

  return {
    call: client.call.bind(client),
    callViaWebSocket: client.callViaWebSocket.bind(client),
    callViaHTTP: client.callViaHTTP.bind(client),
    batchCall: client.batchCall.bind(client),
    isConnected,
  };
};