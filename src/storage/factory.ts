/**
 * 存储工厂
 * 根据环境创建适当的存储实现
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { EnvironmentType } from '../types.js';
import { StorageInterface } from './interface.js';
import { FileSystemStorage } from './file-system.js';
import { CloudflareKVStorage } from './cloudflare-kv.js';

// 获取当前环境类型
export function getEnvironmentType(): EnvironmentType {
  // 检测是否在 Cloudflare Workers 环境中
  try {
    // 在 Cloudflare Workers 环境中，会有 self.caches
    if (typeof self !== 'undefined' && typeof (self as any).__CLOUDFLARE__ !== 'undefined') {
      return EnvironmentType.CLOUDFLARE;
    }
  } catch (e) {
    // 忽略错误
  }
  return EnvironmentType.NODE;
}

// 创建存储实例
export function createStorage(env?: any): StorageInterface {
  const environment = getEnvironmentType();

  if (environment === EnvironmentType.CLOUDFLARE) {
    // 确保 env 中有 PROMPTS_KV
    if (!env || !env.PROMPTS_KV) {
      throw new Error('PROMPTS_KV binding is required in Cloudflare Workers environment');
    }
    return new CloudflareKVStorage(env.PROMPTS_KV);
  } else {
    // Node.js 环境，使用文件系统存储
    // 获取当前文件的目录路径
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    // 设置提示词目录路径
    const promptsDir = path.join(__dirname, '..', '..', 'src', 'prompts');
    return new FileSystemStorage(promptsDir);
  }
}
