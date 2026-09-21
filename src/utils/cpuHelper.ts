/**
 * CPU 型号文本处理。
 */

/**
 * 去掉 CPU 型号里的商标符号等纯噪音，让长型号在卡片里更短。
 *
 * "(R)" / "(TM)" / "(C)" / "®" / "™" 不携带任何型号信息，去掉后：
 *   "Intel(R) Xeon(R) Platinum 8272CL CPU @ 2.60GHz"
 *   -> "Intel Xeon Platinum 8272CL CPU @ 2.60GHz"
 * 正好能从"必须单行截断"变成一行放得下。
 *
 * 其余内容（具体型号、核心数、频率）一律保留，不做猜测性删减——
 * 型号是排障时要看的信息，宁可长一点也不要删错。
 */
export function formatCpuName(cpuName: string): string {
  if (!cpuName) return "";
  return cpuName
    .replace(/\((?:r|tm|c)\)/gi, " ")
    .replace(/[®™]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
