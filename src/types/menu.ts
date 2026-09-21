export interface MenuItem {
  labelKey: string;
  path: string;
  icon: string;
  children?: MenuItem[];
  newTab?: boolean;
  bottom?: boolean;
  /**
   * 暂不渲染该项，但保留其配置与 i18n key。
   * 用于「先下线、以后换个地址再放出来」的入口（如「文档」）。
   * 置为 false / 删掉该字段即恢复显示。
   */
  hidden?: boolean;
}
