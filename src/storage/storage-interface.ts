import { LoadedPrompt } from '../types.js';

/**
 * 存储接口抽象，用于支持不同的存储后端
 */
export interface StorageInterface {
  /**
   * 初始化存储
   */
  initialize(): Promise<void>;

  /**
   * 加载所有提示词
   * @returns 提示词数组
   */
  loadAllPrompts(): Promise<LoadedPrompt[]>;

  /**
   * 添加提示词
   * @param prompt 提示词对象
   * @returns 是否成功
   * @throws {StorageError} 如果添加失败
   */
  addPrompt(prompt: LoadedPrompt): Promise<boolean>;

  /**
   * 更新提示词
   * @param name 提示词名称
   * @param updatedPrompt 更新后的提示词对象
   * @returns 是否成功
   * @throws {StorageError} 如果更新失败
   */
  updatePrompt(name: string, updatedPrompt: LoadedPrompt): Promise<boolean>;

  /**
   * 删除提示词
   * @param name 提示词名称
   * @returns 是否成功
   * @throws {StorageError} 如果删除失败
   */
  deletePrompt(name: string): Promise<boolean>;
}
