import { LoadedPrompt } from '../types.js';
import { StorageInterface } from './storage-interface.js';

/**
 * Cloudflare KV 存储实现
 */
export class CloudflareKVStorage implements StorageInterface {
  private namespace: KVNamespace;
  private prompts: Map<string, LoadedPrompt> = new Map();
  private readonly PROMPTS_LIST_KEY = 'prompt_list';

  /**
   * 构造函数
   * @param namespace Cloudflare KV 命名空间
   */
  constructor(namespace: KVNamespace) {
    this.namespace = namespace;
  }

  /**
   * 初始化存储
   */
  async initialize(): Promise<void> {
    // 加载所有提示词
    await this.loadAllPrompts();
  }

  /**
   * 加载所有提示词
   * @returns 提示词数组
   */
  async loadAllPrompts(): Promise<LoadedPrompt[]> {
    try {
      // 获取提示词名称列表
      const promptNames = await this.getPromptList();
      
      // 清空当前提示词映射
      this.prompts.clear();
      
      // 批量获取所有提示词
      const promises = promptNames.map(name => this.getPrompt(name));
      const prompts = await Promise.all(promises);
      
      // 更新内存中的提示词映射
      prompts.forEach(prompt => {
        if (prompt && prompt.name) {
          this.prompts.set(prompt.name, prompt);
        }
      });
      
      return Array.from(this.prompts.values());
    } catch (error) {
      console.error('Error loading prompts from KV:', error);
      return [];
    }
  }

  /**
   * 获取提示词列表
   * @returns 提示词名称数组
   */
  private async getPromptList(): Promise<string[]> {
    try {
      const listJson = await this.namespace.get(this.PROMPTS_LIST_KEY);
      return listJson ? JSON.parse(listJson) : [];
    } catch (error) {
      console.error('Error getting prompt list from KV:', error);
      return [];
    }
  }

  /**
   * 保存提示词列表
   * @param promptNames 提示词名称数组
   */
  private async savePromptList(promptNames: string[]): Promise<void> {
    await this.namespace.put(this.PROMPTS_LIST_KEY, JSON.stringify(promptNames));
  }

  /**
    } catch (error) {
      logger.error('从 Cloudflare KV 加载提示词失败', error as Error);
      throw new StorageError('无法从 Cloudflare KV 加载提示词', { error });
    }
  }

  /**
   * 添加新的提示词
   * @param prompt 要添加的提示词
   */
  async addPrompt(prompt: LoadedPrompt): Promise<boolean> {
    try {
      // 检查是否已存在
      const promptKey = `${this.keyPrefix}${prompt.name}`;
      const existingPrompt = await this.namespace.get(promptKey);
      if (existingPrompt) {
        logger.warn(`提示词已存在: ${prompt.name}`);
        return false;
      }

      // 获取所有提示词
      const prompts = await this.loadAllPrompts();

      // 添加新提示词
      prompts.push(prompt);

      // 保存单个提示词
      await this.namespace.put(promptKey, JSON.stringify(prompt));

      // 更新所有提示词缓存
      await this.namespace.put('all_prompts', JSON.stringify(prompts));
      logger.info(`添加提示词成功: ${prompt.name}`);

      return true;
    } catch (error) {
      logger.error(`添加提示词到 KV 失败: ${prompt.name}`, error as Error);
      throw new StorageError(`无法添加提示词: ${prompt.name}`, { error });
    }
  }

  /**
   * 更新现有提示词
   * @param name 要更新的提示词名称
   * @param updatedPrompt 更新后的提示词
   */
  async updatePrompt(name: string, updatedPrompt: LoadedPrompt): Promise<boolean> {
    try {
      // 检查是否存在
      const promptKey = `${this.keyPrefix}${name}`;
      const existingPrompt = await this.namespace.get(promptKey);
      if (!existingPrompt) {
        logger.warn(`提示词不存在: ${name}`);
        return false;
      }

      // 获取所有提示词
      const prompts = await this.loadAllPrompts();

      // 更新提示词
      const index = prompts.findIndex(p => p.name === name);
      if (index !== -1) {
        prompts[index] = updatedPrompt;
      }

      // 保存单个提示词
      await this.namespace.put(promptKey, JSON.stringify(updatedPrompt));

      // 更新所有提示词缓存
      await this.namespace.put('all_prompts', JSON.stringify(prompts));
      logger.info(`更新提示词成功: ${name}`);

      return true;
    } catch (error) {
      logger.error(`更新 KV 中的提示词失败: ${name}`, error as Error);
      throw new StorageError(`无法更新提示词: ${name}`, { error });
    }
  }

  /**
   * 删除提示词
   * @param name 要删除的提示词名称
   */
  async deletePrompt(name: string): Promise<boolean> {
    try {
      // 检查是否存在
      const promptKey = `${this.keyPrefix}${name}`;
      const existingPrompt = await this.namespace.get(promptKey);
      if (!existingPrompt) {
        logger.warn(`提示词不存在: ${name}`);
        return false;
      }

      // 获取所有提示词
      const prompts = await this.loadAllPrompts();

      // 从列表中删除
      const filteredPrompts = prompts.filter(p => p.name !== name);

      // 删除单个提示词
      await this.namespace.delete(promptKey);

      // 更新所有提示词缓存
      await this.namespace.put('all_prompts', JSON.stringify(filteredPrompts));
      logger.info(`删除提示词成功: ${name}`);

      return true;
    } catch (error) {
      logger.error(`从 KV 删除提示词失败: ${name}`, error as Error);
      throw new StorageError(`无法删除提示词: ${name}`, { error });
    }
  }
}
