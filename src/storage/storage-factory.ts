import { StorageInterface } from './storage-interface.js';
import { FileStorage } from './file-storage.js';
import { logger } from '../utils/error-handler.js';

/**
 * 存储工厂类，用于创建存储实例
 * 简化版，只支持文件存储
 */
export class StorageFactory {
  /**
   * 创建存储实例
   * @param options 存储选项
   * @returns 存储实例
   */
  static createStorage(options: any): StorageInterface {
    const promptsDir = options.promptsDir || './prompts';
    const promptsFile = options.promptsFile || 'prompts.json';
    
    logger.info(`创建文件存储，目录: ${promptsDir}, 文件: ${promptsFile}`);
    return new FileStorage(promptsDir, promptsFile);
  }

  /**
   * 检测环境并创建合适的存储实例
   * @param options 存储选项
   * @returns 存储实例
   */
  static detectAndCreateStorage(options: any): StorageInterface {
    logger.info('使用文件存储模式');
    return StorageFactory.createStorage(options);
  }
}
