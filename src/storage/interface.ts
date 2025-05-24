/**
 * 存储接口抽象层
 * 定义了提示词存储的通用接口，可以有不同的实现（文件系统、Cloudflare KV等）
 */

import { Prompt, LoadedPrompt } from '../types';

export interface StorageInterface {
  /**
   * 获取所有提示词
   * @returns 提示词数组
   */
  getAllPrompts(): Promise<LoadedPrompt[]>;
  
  /**
   * 根据名称获取提示词
   * @param name 提示词名称
   * @returns 提示词对象，如果不存在则返回null
   */
  getPromptByName(name: string): Promise<LoadedPrompt | null>;
  
  /**
   * 添加新提示词
   * @param prompt 提示词对象
   * @returns 成功返回true，失败返回false
   */
  addPrompt(prompt: LoadedPrompt): Promise<boolean>;
  
  /**
   * 更新提示词
   * @param name 提示词名称
   * @param prompt 更新后的提示词对象
   * @returns 成功返回true，失败返回false
   */
  updatePrompt(name: string, prompt: LoadedPrompt): Promise<boolean>;
  
  /**
   * 删除提示词
   * @param name 提示词名称
   * @returns 成功返回true，失败返回false
   */
  deletePrompt(name: string): Promise<boolean>;
}
