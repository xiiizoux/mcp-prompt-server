/**
 * 提示词服务核心逻辑
 * 处理提示词的加载、处理和管理
 */

import { Prompt, LoadedPrompt, ToolInputArgs, ToolOutput } from '../types.js';
import { StorageInterface } from '../storage/interface.js';

export class PromptService {
  private storage: StorageInterface;
  private loadedPrompts: LoadedPrompt[] = [];

  constructor(storage: StorageInterface) {
    this.storage = storage;
  }

  /**
   * 加载所有提示词
   */
  async loadAllPrompts(): Promise<LoadedPrompt[]> {
    this.loadedPrompts = await this.storage.getAllPrompts();
    return this.loadedPrompts;
  }

  /**
   * 获取所有已加载的提示词
   */
  getLoadedPrompts(): LoadedPrompt[] {
    return this.loadedPrompts;
  }

  /**
   * 获取提示词名称列表
   */
  getPromptNames(): string[] {
    return this.loadedPrompts.map(p => p.name);
  }

  /**
   * 处理提示词
   * @param promptName 提示词名称
   * @param args 参数
   * @returns 处理后的提示词内容
   */
  async processPrompt(promptName: string, args: ToolInputArgs): Promise<ToolOutput> {
    // 查找提示词
    const prompt = this.loadedPrompts.find(p => p.name === promptName);
    if (!prompt) {
      return {
        content: [{ type: "text", text: `Prompt '${promptName}' not found.` }],
        isError: true
      };
    }

    let promptText = '';
    if (prompt.messages && Array.isArray(prompt.messages)) {
      const userMessages = prompt.messages.filter(msg => msg.role === 'user');
      for (const message of userMessages) {
        let textContent: string | undefined;
        if ('text' in message.content) {
          textContent = (message.content as { text: string }).text;
        } else if (message.content.type === 'text' && typeof message.content.text === 'string') {
          textContent = message.content.text;
        }

        if (textContent) {
          let text = textContent;
          for (const [key, value] of Object.entries(args)) {
            text = text.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
          }
          promptText += text + '\n\n';
        }
      }
    }

    return { content: [{ type: "text", text: promptText.trim() }] };
  }

  /**
   * 添加新提示词
   * @param prompt 提示词对象
   * @returns 操作结果
   */
  async addPrompt(prompt: LoadedPrompt): Promise<ToolOutput> {
    // 验证提示词
    if (!prompt.name) {
      return {
        content: [{ type: "text", text: "Prompt must have a name." }],
        isError: true
      };
    }

    if (!prompt.messages || !Array.isArray(prompt.messages) || prompt.messages.length === 0) {
      return {
        content: [{ type: "text", text: "Prompt must have at least one message." }],
        isError: true
      };
    }

    // 检查是否已存在同名提示词
    const existingPrompt = this.loadedPrompts.find(p => p.name === prompt.name);
    if (existingPrompt) {
      return {
        content: [{ type: "text", text: `Prompt '${prompt.name}' already exists. Use updatePrompt to modify it.` }],
        isError: true
      };
    }

    // 添加提示词
    const success = await this.storage.addPrompt(prompt);
    if (!success) {
      return {
        content: [{ type: "text", text: `Failed to add prompt '${prompt.name}'.` }],
        isError: true
      };
    }

    // 重新加载提示词
    await this.loadAllPrompts();

    return {
      content: [{ type: "text", text: `Prompt '${prompt.name}' added successfully. Total prompts: ${this.loadedPrompts.length}.` }]
    };
  }

  /**
   * 更新提示词
   * @param name 提示词名称
   * @param updatedPrompt 更新后的提示词
   * @returns 操作结果
   */
  async updatePrompt(name: string, updatedPrompt: Partial<Prompt>): Promise<ToolOutput> {
    // 查找现有提示词
    const existingPrompt = this.loadedPrompts.find(p => p.name === name);
    if (!existingPrompt) {
      return {
        content: [{ type: "text", text: `Prompt '${name}' not found.` }],
        isError: true
      };
    }

    // 合并更新
    const mergedPrompt: LoadedPrompt = {
      ...existingPrompt,
      ...updatedPrompt,
      name: updatedPrompt.name || existingPrompt.name // 确保name字段存在
    };

    // 更新提示词
    const success = await this.storage.updatePrompt(name, mergedPrompt);
    if (!success) {
      return {
        content: [{ type: "text", text: `Failed to update prompt '${name}'.` }],
        isError: true
      };
    }

    // 重新加载提示词
    await this.loadAllPrompts();

    return {
      content: [{ type: "text", text: `Prompt '${name}' updated successfully. Total prompts: ${this.loadedPrompts.length}.` }]
    };
  }

  /**
   * 删除提示词
   * @param name 提示词名称
   * @returns 操作结果
   */
  async deletePrompt(name: string): Promise<ToolOutput> {
    // 查找现有提示词
    const existingPrompt = this.loadedPrompts.find(p => p.name === name);
    if (!existingPrompt) {
      return {
        content: [{ type: "text", text: `Prompt '${name}' not found.` }],
        isError: true
      };
    }

    // 删除提示词
    const success = await this.storage.deletePrompt(name);
    if (!success) {
      return {
        content: [{ type: "text", text: `Failed to delete prompt '${name}'.` }],
        isError: true
      };
    }

    // 重新加载提示词
    await this.loadAllPrompts();

    return {
      content: [{ type: "text", text: `Prompt '${name}' deleted successfully. Total prompts: ${this.loadedPrompts.length}.` }]
    };
  }
}
