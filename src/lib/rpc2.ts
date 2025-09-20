import type {
  JSONRPC2Request,
  JSONRPC2Response,
  JSONRPC2BatchRequest,
  JSONRPC2BatchResponse,
  RPC2ConnectionStateType,
  RPC2ConnectionOptions,
  RPC2CallOptions,
  RPC2EventListeners,
} from "../types/rpc2";
import { RPC2ConnectionState } from "../types/rpc2";

/**
 * RPC2 客户端类
 * 支持通过 WebSocket 和 HTTP POST 调用 JSON-RPC 2.0 接口
 */
export class RPC2Client {
  private ws: WebSocket | null = null;
  private connectionState: RPC2ConnectionStateType = RPC2ConnectionState.DISCONNECTED;
  private requestId = 0;
  private pendingRequests = new Map<string | number, {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    timeout?: NodeJS.Timeout;
  }>();
  private reconnectAttempts = 0;
  private reconnectTimeout?: NodeJS.Timeout;
  private heartbeatInterval?: NodeJS.Timeout;
  private eventListeners: RPC2EventListeners = {};
 
  private readonly baseUrl: string;
  private readonly options: Required<RPC2ConnectionOptions>;

  constructor(
    baseUrl = "/api/rpc2",
    options: RPC2ConnectionOptions = {}
  ) {
    this.baseUrl = baseUrl;
    this.options = {
      autoConnect: true,
      autoReconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      requestTimeout: 30000,
      enableHeartbeat: true,
      heartbeatInterval: 5000,
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    };

    // 自动建立连接
    if (this.options.autoConnect) {
      this.autoConnect();
    }
  }

  /**
   * 获取当前连接状态
   */
  get state(): RPC2ConnectionStateType {
    return this.connectionState;
  }

  /**
   * 设置事件监听器
   */
  setEventListeners(listeners: RPC2EventListeners): void {
    this.eventListeners = { ...this.eventListeners, ...listeners };
  }

  /**
   * 建立 WebSocket 连接
   */
  async connect(): Promise<void> {
    if (this.connectionState === RPC2ConnectionState.CONNECTED || 
        this.connectionState === RPC2ConnectionState.CONNECTING) {
      return;
    }

    this.setConnectionState(RPC2ConnectionState.CONNECTING);

    try {
      const wsUrl = this.getWebSocketUrl();
      this.ws = new WebSocket(wsUrl);
      this.setupWebSocketHandlers();

      // 等待连接建立
      await new Promise<void>((resolve, reject) => {
        if (!this.ws) {
          reject(new Error("WebSocket 创建失败"));
          return;
        }

        const timeout = setTimeout(() => {
          reject(new Error("WebSocket 连接超时"));
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          resolve();
        };

        this.ws.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("WebSocket 连接失败"));
        };
      });
    } catch (error) {
      this.setConnectionState(RPC2ConnectionState.ERROR);
      this.eventListeners.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * 自动建立连接（非阻塞）
   */
  private autoConnect(): void {
    if (this.connectionState !== RPC2ConnectionState.DISCONNECTED) {
      return;
    }

    // 异步尝试连接，不阻塞构造函数
    this.connect().catch((error) => {
      console.warn("自动连接失败:", error.message);
      // 连接失败时，如果启用了自动重连，会在 onclose 处理器中进行重连
    });
  }

  /**
   * 断开 WebSocket 连接
   */
  disconnect(): void {
    this.options.autoReconnect = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    // 清理心跳包定时器
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setConnectionState(RPC2ConnectionState.DISCONNECTED);
    this.clearPendingRequests(new Error("连接已断开"));
  }

  /**
   * 通过 WebSocket 调用 RPC 方法
   */
  async callViaWebSocket<TParams = any, TResult = any>(
    method: string,
    params?: TParams,
    options: RPC2CallOptions = {}
  ): Promise<TResult> {
    if (this.connectionState !== RPC2ConnectionState.CONNECTED) {
      throw new Error("WebSocket 未连接");
    }

    const request: JSONRPC2Request<TParams> = {
      jsonrpc: "2.0",
      method,
      params,
      id: options.notification ? undefined : this.generateRequestId(),
    };

    if (options.notification) {
      // 通知请求，不期望响应
      this.sendMessage(request);
      return undefined as TResult;
    }

    return new Promise<TResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(request.id!);
        reject(new Error(`请求超时: ${method}`));
      }, options.timeout || this.options.requestTimeout);

      this.pendingRequests.set(request.id!, {
        resolve,
        reject,
        timeout,
      });

      this.sendMessage(request);
    });
  }

  /**
   * 通过 HTTP POST 调用 RPC 方法
   */
  async callViaHTTP<TParams = any, TResult = any>(
    method: string,
    params?: TParams,
    options: RPC2CallOptions = {}
  ): Promise<TResult> {
    const request: JSONRPC2Request<TParams> = {
      jsonrpc: "2.0",
      method,
      params,
      id: options.notification ? undefined : this.generateRequestId(),
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: this.options.headers,
        body: JSON.stringify(request),
        signal: options.timeout ? AbortSignal.timeout(options.timeout) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (options.notification) {
        return undefined as TResult;
      }

      const jsonResponse: JSONRPC2Response<TResult> = await response.json();
      
      if ("error" in jsonResponse) {
        throw new Error(`RPC Error ${jsonResponse.error.code}: ${jsonResponse.error.message}`);
      }

      return jsonResponse.result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`请求失败: ${method}`);
    }
  }

  /**
   * 批量调用（仅支持 HTTP）
   */
  async batchCall(requests: Array<{
    method: string;
    params?: any;
    notification?: boolean;
  }>): Promise<any[]> {
    const batchRequest: JSONRPC2BatchRequest = requests.map(req => ({
      jsonrpc: "2.0",
      method: req.method,
      params: req.params,
      id: req.notification ? undefined : this.generateRequestId(),
    }));

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: this.options.headers,
        body: JSON.stringify(batchRequest),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const jsonResponse: JSONRPC2BatchResponse = await response.json();
      
      return jsonResponse.map(res => {
        if ("error" in res) {
          throw new Error(`RPC Error ${res.error.code}: ${res.error.message}`);
        }
        return res.result;
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("批量请求失败");
    }
  }

  /**
   * 自动选择调用方式（优先使用 WebSocket）
   */
  async call<TParams = any, TResult = any>(
    method: string,
    params?: TParams,
    options: RPC2CallOptions = {}
  ): Promise<TResult> {
    // 如果启用了自动连接，且当前未连接，尝试建立连接
    if (this.options.autoConnect && 
        this.connectionState === RPC2ConnectionState.DISCONNECTED) {
      this.autoConnect();
      // 给连接一点时间，但不要等太久
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (this.connectionState === RPC2ConnectionState.CONNECTED) {
      return this.callViaWebSocket(method, params, options);
    } else {
      return this.callViaHTTP(method, params, options);
    }
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    return `${protocol}//${host}${this.baseUrl}`;
  }

  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.setConnectionState(RPC2ConnectionState.CONNECTED);
      this.reconnectAttempts = 0;
      this.startHeartbeat(); // 启动心跳包
      this.eventListeners.onConnect?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
        this.eventListeners.onMessage?.(data);
      } catch (error) {
        console.error("解析 WebSocket 消息失败:", error);
      }
    };

    this.ws.onclose = () => {
      this.setConnectionState(RPC2ConnectionState.DISCONNECTED);
      this.stopHeartbeat(); // 停止心跳包
      this.eventListeners.onDisconnect?.();
      
      if (this.options.autoReconnect && 
          this.reconnectAttempts < this.options.maxReconnectAttempts) {
        this.attemptReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket 错误:", error);
      this.eventListeners.onError?.(new Error("WebSocket 连接错误"));
    };
  }

  private handleMessage(data: JSONRPC2Response): void {
    if (!data.id) return; // 忽略通知响应

    const pending = this.pendingRequests.get(data.id);
    if (!pending) return;

    this.pendingRequests.delete(data.id);
    
    if (pending.timeout) {
      clearTimeout(pending.timeout);
    }

    if ("error" in data) {
      pending.reject(new Error(`RPC Error ${data.error.code}: ${data.error.message}`));
    } else {
      pending.resolve(data.result);
    }
  }

  private sendMessage(message: JSONRPC2Request): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket 未连接");
    }

    this.ws.send(JSON.stringify(message));
  }

  private setConnectionState(state: RPC2ConnectionStateType): void {
    this.connectionState = state;
  }

  private generateRequestId(): number {
    return ++this.requestId;
  }

  private clearPendingRequests(error: Error): void {
    for (const [, pending] of this.pendingRequests) {
      if (pending.timeout) {
        clearTimeout(pending.timeout);
      }
      pending.reject(error);
    }
    this.pendingRequests.clear();
  }

  /**
   * 启动心跳包
   */
  private startHeartbeat(): void {
    // 如果未启用心跳包，则不启动
    if (!this.options.enableHeartbeat) {
      return;
    }
    
    // 先清理之前的心跳包定时器
    this.stopHeartbeat();
    
    // 按配置的间隔发送心跳包
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          // 发送心跳包作为通知请求（不期望响应）
          const heartbeatRequest: JSONRPC2Request = {
            jsonrpc: "2.0",
            method: "heartbeat",
            params: { timestamp: Date.now() }
          };
          this.ws.send(JSON.stringify(heartbeatRequest));
        } catch (error) {
          console.warn("发送心跳包失败:", error);
        }
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * 停止心跳包
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    this.setConnectionState(RPC2ConnectionState.RECONNECTING);
    this.eventListeners.onReconnecting?.(this.reconnectAttempts);

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(() => {
        // 重连失败会触发 onclose，从而继续重连或停止
      });
    }, this.options.reconnectInterval);
  }
}

// 创建默认实例
export const defaultRPC2Client = new RPC2Client();
export const rpc2 = new RPC2Client();