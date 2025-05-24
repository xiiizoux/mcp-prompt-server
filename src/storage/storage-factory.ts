import { StorageInterface } from './storage-interface.js';
import { FileStorage } from './file-storage.js';
import { CloudflareKVStorage } from './cloudflare-kv-storage.js';
import { SupabaseStorage } from './supabase-storage.js';

/**
 * 存储类型枚举
 */
export enum StorageType {
  FILE = 'file',
  CLOUDFLARE_KV = 'cloudflare_kv',
  SUPABASE = 'supabase'
}

/**
 * 存储工厂类，用于创建不同类型的存储实例
 */
export class StorageFactory {
  /**
   * 创建存储实例
   * @param type 存储类型
   * @param options 存储选项
   * @returns 存储实例
   */
  static createStorage(type: StorageType, options: any): StorageInterface {
    switch (type) {
      case StorageType.FILE:
        return new FileStorage(options.promptsDir, options.promptsFile);
      case StorageType.CLOUDFLARE_KV:
        if (!options.namespace) {
          throw new Error('KV namespace is required for Cloudflare KV storage');
        }
        return new CloudflareKVStorage(options.namespace);
      case StorageType.SUPABASE:
        if (!options.supabaseUrl || !options.supabaseKey) {
          throw new Error('Supabase URL and API key are required for Supabase storage');
        }
        return new SupabaseStorage(options.supabaseUrl, options.supabaseKey);
      default:
        throw new Error(`Unsupported storage type: ${type}`);
    }
  }

  /**
   * 检测环境并创建合适的存储实例
   * @param options 存储选项
   * @returns 存储实例
   */
  static detectAndCreateStorage(options: any): StorageInterface {
    // 如果指定了存储类型，优先使用指定的类型
    if (options.storageType) {
      switch (options.storageType) {
        case 'supabase':
          if (options.supabaseUrl && options.supabaseKey) {
            return StorageFactory.createStorage(StorageType.SUPABASE, options);
          }
          break;
        case 'cloudflare_kv':
          if (options.namespace) {
            return StorageFactory.createStorage(StorageType.CLOUDFLARE_KV, options);
          }
          break;
        case 'file':
          return StorageFactory.createStorage(StorageType.FILE, options);
      }
    }
    
    // 如果有 Supabase 配置，优先使用 Supabase
    if (options.supabaseUrl && options.supabaseKey) {
      return StorageFactory.createStorage(StorageType.SUPABASE, options);
    }
    
    // 检查是否在 Cloudflare Workers 环境
    const isCloudflareWorkers = typeof globalThis.caches !== 'undefined';
    
    if (isCloudflareWorkers) {
      if (!options.namespace) {
        throw new Error('KV namespace is required for Cloudflare Workers environment');
      }
      return StorageFactory.createStorage(StorageType.CLOUDFLARE_KV, options);
    } else {
      // 默认使用文件存储
      return StorageFactory.createStorage(StorageType.FILE, options);
    }
  }
}
