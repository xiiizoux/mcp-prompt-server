/**
 * 存储工厂
 * 用于创建适合当前环境的存储实例
 */

import { StorageFactory } from './storage-factory.js';

/**
 * 创建存储实例
 * @param {Object} options 存储选项
 * @returns {import('./storage-interface.js').StorageInterface} 存储实例
 */
export function createStorage(options = {}) {
  // 默认选项
  const defaultOptions = {
    promptsDir: process.env.PROMPTS_DIR || './prompts',
    promptsFile: process.env.PROMPTS_FILE || 'prompts.json'
  };

  // 合并选项
  const mergedOptions = { ...defaultOptions, ...options };

  // 检测环境并创建合适的存储实例
  return StorageFactory.detectAndCreateStorage(mergedOptions);
}
