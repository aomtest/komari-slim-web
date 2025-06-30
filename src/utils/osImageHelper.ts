/**
 * OS Image Helper - 根据字符串匹配返回操作系统图像路径
 */

// 操作系统图像映射表
const osImageMap: Record<string, string> = {
  'alma': '/assets/os-alma.svg',
  'alpine': '/assets/os-alpine.webp',
  'centos': '/assets/os-centos.svg',
  'debian': '/assets/os-debian.svg',
  'ubuntu': '/assets/os-ubuntu.svg',
  'windows': '/assets/os-windows.svg',
  'unknown': '/assets/TablerHelp.svg'
};

// 操作系统关键词匹配模式
const osPatterns: Array<{ keywords: string[], image: string }> = [
  {
    keywords: ['alma', 'almalinux'],
    image: osImageMap.alma
  },
  {
    keywords: ['alpine', 'alpine linux'],
    image: osImageMap.alpine
  },
  {
    keywords: ['centos', 'cent os', 'rhel', 'red hat'],
    image: osImageMap.centos
  },
  {
    keywords: ['debian', 'deb'],
    image: osImageMap.debian
  },
  {
    keywords: ['ubuntu', 'mint', 'elementary'],
    image: osImageMap.ubuntu
  },
  {
    keywords: ['windows', 'win', 'microsoft', 'ms'],
    image: osImageMap.windows
  },
  {
    keywords: ['unknown'],
    image: osImageMap.unknown
  }
];

/**
 * 根据输入字符串匹配返回操作系统图像路径
 * @param osString - 操作系统相关的字符串
 * @returns 匹配的操作系统图像路径，如果没有匹配则返回默认图像
 */
export function getOSImage(osString: string): string {
  if (!osString) {
    return osImageMap.unknown; // 默认返回 Unknown 图像
  }

  const normalizedInput = osString.toLowerCase().trim();

  // 遍历匹配模式
  for (const pattern of osPatterns) {
    for (const keyword of pattern.keywords) {
      if (normalizedInput.includes(keyword)) {
        return pattern.image;
      }
    }
  }

  // 如果没有匹配到，返回默认图像
  return osImageMap.unknown;
}

/**
 * 获取所有可用的操作系统图像
 * @returns 所有操作系统图像的映射表
 */
export function getAllOSImages(): Record<string, string> {
  return { ...osImageMap };
}

/**
 * 根据输入字符串匹配返回操作系统名称
 * @param osString - 操作系统相关的字符串
 * @returns 匹配的操作系统名称
 */
export function getOSName(osString: string): string {
  if (!osString) {
    return 'Unknown';
  }

  const normalizedInput = osString.toLowerCase().trim();

  // 精确匹配操作系统名称
  if (normalizedInput.includes('alma')) return 'AlmaLinux';
  if (normalizedInput.includes('alpine')) return 'Alpine Linux';
  if (normalizedInput.includes('centos') || normalizedInput.includes('rhel')) return 'CentOS';
  if (normalizedInput.includes('debian')) return 'Debian';
  if (normalizedInput.includes('ubuntu')) return 'Ubuntu';
  if (normalizedInput.includes('windows') || normalizedInput.includes('win')) return 'Windows';

  return 'Unknown';
}

/**
 * 检查是否为支持的操作系统
 * @param osString - 操作系统相关的字符串
 * @returns 是否为支持的操作系统
 */
export function isSupportedOS(osString: string): boolean {
  if (!osString) return false;

  const normalizedInput = osString.toLowerCase().trim();
  
  return osPatterns.some(pattern => 
    pattern.keywords.some(keyword => 
      normalizedInput.includes(keyword)
    )
  );
}
