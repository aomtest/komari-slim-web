import React from "react";
import { useRPC2Call } from "./RPC2Context";

export type NodeBasicInfo = {
  /** 节点唯一标识符 */
  uuid: string;
  /** 节点名称 */
  name: string;
  /** CPU型号 */
  cpu_name: string;
  /** 虚拟化 */
  virtualization: string;
  /** 系统架构 */
  arch: string;
  /** CPU核心数 */
  cpu_cores: number;
  /** 操作系统 */
  os: string;
  /** 内核版本 */
  kernel_version: string;
  /** GPU型号 */
  gpu_name: string;
  /** 地区标识 */
  region: string;
  /** 总内存(字节) */
  mem_total: number;
  /** 总交换空间(字节) */
  swap_total: number;
  /** 总磁盘空间(字节) */
  disk_total: number;
  /** 版本号 */
  version: string;
  /** 权重 */
  weight: number;
  /** 价格 */
  price: number;
  tags: string;
  /** 账单周期（天）*/
  billing_cycle: number;
  /** 货币 */
  currency: string;
  /** 分组 */
  group: string;
  /** 流量阈值 */
  traffic_limit: number;
  /** 流量阈值类型 */
  traffic_limit_type: undefined | "sum" | "max" | "min" | "up" | "down";
  /** 过期时间 */
  expired_at: string;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
  ipv4?: string; 
  ipv6?: string;
};

interface NodeListContextType {
  nodeList: NodeBasicInfo[] | null;
  isLoading: boolean;
  error: string | null;
  /** 返回的 Promise 会在一次请求彻底结束后 settle，调用方可以据此串行调度。 */
  refresh: () => Promise<void>;
}

const NODE_LIST_CONTEXT_KEY = "__komariNodeListContext" as const;

type NodeListContextGlobal = typeof globalThis & {
  [NODE_LIST_CONTEXT_KEY]?: React.Context<NodeListContextType | undefined>;
};

const globalNodeListContext = globalThis as NodeListContextGlobal;
const NodeListContext =
  globalNodeListContext[NODE_LIST_CONTEXT_KEY] ??
  (globalNodeListContext[NODE_LIST_CONTEXT_KEY] =
    React.createContext<NodeListContextType | undefined>(undefined));

const sameNodeBasicInfo = (left: NodeBasicInfo, right: NodeBasicInfo) =>
  (Object.keys(right) as Array<keyof NodeBasicInfo>).every(
    (key) => left[key] === right[key],
  );

export const NodeListProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [nodeList, setNodeList] = React.useState<NodeBasicInfo[] | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const { call } = useRPC2Call();
  const refreshSeqRef = React.useRef(0);
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = React.useCallback(() => {
    const refreshSeq = ++refreshSeqRef.current;
    // setIsLoading(true);
    // 注意：这里**不**预先 setError(null)。乐观清除会让「重试中」的错误
    // 反复消失又出现，首屏失败时界面会一屏错误、一屏空列表地闪。
    // 只在真正收到响应后才清。
    // 通过 RPC2 获取节点基本信息
    return call<{ uuid?: string }, Record<string, any>>("common:getNodes")
      .then((result) => {
        if (!mountedRef.current || refreshSeq !== refreshSeqRef.current) return;
        setError(null);
        if (!result || typeof result !== "object") {
          // 返回了非法结果。**不要**把列表清空：一次异常响应就抹掉全部卡片，
          // 页面高度会瞬间塌到只有页头和页脚，浏览器的 scrollTop 被夹回 0，
          // 用户再想看某台机器就得重新滚一遍。保留上一次的数据，只记录错误。
          setError("Unexpected response for common:getNodes");
          return;
        }
        // 将 { [uuid]: Client } 转换为 NodeBasicInfo[]
        const list: NodeBasicInfo[] = Object.values(result).map((n: any) => ({
          uuid: n.uuid,
          name: n.name,
          cpu_name: n.cpu_name,
          virtualization: n.virtualization,
          arch: n.arch,
          cpu_cores: n.cpu_cores,
          os: n.os,
          kernel_version: n.kernel_version,
          gpu_name: n.gpu_name,
          region: n.region,
          mem_total: n.mem_total,
          swap_total: n.swap_total,
          disk_total: n.disk_total,
          // 兼容旧字段，若无版本信息则给空串
          version: n.version ?? "",
          weight: n.weight ?? 0,
          price: n.price ?? 0,
          tags: n.tags ?? "",
          billing_cycle: n.billing_cycle ?? 0,
          currency: n.currency ?? "",
          group: n.group ?? "",
          traffic_limit: n.traffic_limit ?? 0,
          traffic_limit_type: n.traffic_limit_type,
          expired_at: n.expired_at ?? "",
          created_at: n.created_at ?? "",
          updated_at: n.updated_at ?? "",
          ipv4: n.ipv4,
          ipv6: n.ipv6,
        }));
        setNodeList((previous) => {
          if (!previous) return list;
          const previousByUuid = new Map(
            previous.map((node) => [node.uuid, node]),
          );
          let changed = previous.length !== list.length;
          const shared = list.map((node, index) => {
            const previousNode = previousByUuid.get(node.uuid);
            if (previousNode && sameNodeBasicInfo(previousNode, node)) {
              if (previous[index] !== previousNode) changed = true;
              return previousNode;
            }
            changed = true;
            return node;
          });
          return changed ? shared : previous;
        });
      })
      .catch((err: any) => {
        if (!mountedRef.current || refreshSeq !== refreshSeqRef.current) return;
        // 同上：轮询失败只标记错误，保留已渲染的列表。
        //
        // 这条路径是长时间挂着面板时最常见的一次「全部卡片消失」：RPC 走
        // WebSocket，心跳 15s、请求超时 30s，链路一旦假死就会 reject 一次；
        // 清空列表的代价是整页高度归零、滚动位置丢失，而数据本身 5 秒后
        // 就回来了。宁可显示几秒旧数据，也不要把页面撕掉重排。
        setError(err?.message || "An error occurred while fetching data");
      })
      .finally(() => {
        if (!mountedRef.current || refreshSeq !== refreshSeqRef.current) return;
        setIsLoading(false);
      });
  }, [call]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const contextValue = React.useMemo(
    () => ({ nodeList, isLoading, error, refresh }),
    [nodeList, isLoading, error, refresh],
  );

  return (
    <NodeListContext.Provider value={contextValue}>
      {children}
    </NodeListContext.Provider>
  );
};

export function useNodeList(): NodeListContextType;
export function useNodeList(required: false): NodeListContextType | undefined;
export function useNodeList(required = true) {
  const context = React.useContext(NodeListContext);
  if (!context && required) {
    throw new Error("useNodeList must be used within a NodeListProvider");
  }
  return context;
}
