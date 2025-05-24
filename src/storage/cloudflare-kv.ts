/**
 * Cloudflare KV 存储实现
 * 使用 Cloudflare KV 存储提示词
 */

import { Prompt, LoadedPrompt } from '../types';
import { StorageInterface } from './interface';

export class CloudflareKVStorage implements StorageInterface {
  private namespace: KVNamespace;
  private promptsPrefix: string = 'prompt:';

  constructor(namespace: KVNamespace) {
    this.namespace = namespace;
  }

  /**
   * 获取提示词的KV键名
   * @param name 提示词名称
   * @returns KV键名
   */
  private getPromptKey(name: string): string {
    return `${this.promptsPrefix}${name}`;
  }

  /**
   * 获取所有提示词
   */
  async getAllPrompts(): Promise<LoadedPrompt[]> {
    try {
      // 列出所有以promptsPrefix开头的键
      const keys = await this.namespace.list({ prefix: this.promptsPrefix });
      const prompts: LoadedPrompt[] = [];

      // 并行获取所有提示词
      const promptPromises = keys.keys.map(async (key) => {
        const promptJson = await this.namespace.get(key.name);
        if (promptJson) {
          try {
            const prompt = JSON.parse(promptJson) as Prompt;
            if (prompt.name) {
              return prompt as LoadedPrompt;
            }
          } catch (error) {
            console.error(`Error parsing prompt from KV: ${key.name}`, error);
          }
        }
        return null;
      });

      const results = await Promise.all(promptPromises);
      return results.filter((prompt): prompt is LoadedPrompt => prompt !== null);
    } catch (error) {
      console.error('Error loading prompts from Cloudflare KV:', error);
      return [];
    }
  }

  /**
   * 根据名称获取提示词
   */
  async getPromptByName(name: string): Promise<LoadedPrompt | null> {
    try {
      const key = this.getPromptKey(name);
      const promptJson = await this.namespace.get(key);
      
      if (!promptJson) {
        return null;
      }
      
      const prompt = JSON.parse(promptJson) as Prompt;
      
      if (!prompt.name) {
        prompt.name = name;
      }
      
      return prompt as LoadedPrompt;
    } catch (error) {
      console.error(`Error getting prompt '${name}' from Cloudflare KV:`, error);
      return null;
    }
  }

  /**
   * 添加新提示词
   */
  async addPrompt(prompt: LoadedPrompt): Promise<boolean> {
    try {
      const key = this.getPromptKey(prompt.name);
      
      // 检查提示词是否已存在
      const existing = await this.namespace.get(key);
      if (existing) {
        return false; // 提示词已存在
      }
      
      // 存储提示词
      await this.namespace.put(key, JSON.stringify(prompt));
      
      return true;
    } catch (error) {
      console.error(`Error adding prompt '${prompt.name}' to Cloudflare KV:`, error);
      return false;
    }
  }

  /**
   * 更新提示词
   */
  async updatePrompt(name: string, prompt: LoadedPrompt): Promise<boolean> {
    try {
      const key = this.getPromptKey(name);
      
      // 检查提示词是否存在
      const existing = await this.namespace.get(key);
      if (!existing) {
        return false; // 提示词不存在
      }
      
      // 如果名称变更，需要删除旧键并创建新键
      if (name !== prompt.name) {
        const newKey = this.getPromptKey(prompt.name);
        await this.namespace.delete(key);
        await this.namespace.put(newKey, JSON.stringify(prompt));
      } else {
        // 直接更新现有键
        await this.namespace.put(key, JSON.stringify(prompt));
      }
      
      return true;
    } catch (error) {
      console.error(`Error updating prompt '${name}' in Cloudflare KV:`, error);
      return false;
    }
  }

  /**
   * 删除提示词
   */
  async deletePrompt(name: string): Promise<boolean> {
    try {
      const key = this.getPromptKey(name);
      
      // 检查提示词是否存在
      const existing = await this.namespace.get(key);
      if (!existing) {
        return false; // 提示词不存在
      }
      
      // 删除提示词
      await this.namespace.delete(key);
      
      return true;
    } catch (error) {
      console.error(`Error deleting prompt '${name}' from Cloudflare KV:`, error);
      return false;
    }
  }
}
