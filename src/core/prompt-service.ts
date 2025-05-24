/**
 * 提示词服务核心逻辑
 * 处理提示词的加载、处理和管理
 */

import { LoadedPrompt, Prompt, PromptCategory, PromptTag, ToolOutput, ToolInputArgs } from '../types.js';
import { StorageInterface } from '../storage/storage-interface.js';

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
    this.loadedPrompts = await this.storage.loadAllPrompts();
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
   * @param category 可选的类别过滤
   * @param tags 可选的标签过滤（数组）
   * @returns 提示词名称数组
   */
  getPromptNames(category?: PromptCategory, tags?: PromptTag[]): string[] {
    let filteredPrompts = this.loadedPrompts;
    
    // 按类别过滤
    if (category) {
      filteredPrompts = filteredPrompts.filter(p => p.category === category);
    }
    
    // 按标签过滤
    if (tags && tags.length > 0) {
      filteredPrompts = filteredPrompts.filter(p => {
        if (!p.tags || p.tags.length === 0) return false;
        // 检查是否包含任一标签
        return tags.some(tag => p.tags?.includes(tag));
      });
    }
    
    return filteredPrompts.map(p => p.name);
  }
  
  /**
   * 搜索提示词，支持分页
   * @param keyword 关键词
   * @param category 可选的类别过滤
   * @param tags 可选的标签过滤
   * @param page 页码，从1开始
   * @param pageSize 每页数量
   * @returns 搜索结果对象，包含提示词数组和分页信息
   */
  async searchPrompts(
    keyword: string, 
    category?: PromptCategory, 
    tags?: PromptTag[], 
    page: number = 1, 
    pageSize: number = 10
  ): Promise<{ 
    prompts: LoadedPrompt[], 
    total: number, 
    page: number, 
    pageSize: number, 
    totalPages: number 
  }> {
    let filteredPrompts = this.loadedPrompts;
    
    // 按关键词过滤
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      filteredPrompts = filteredPrompts.filter(p => {
        // 搜索名称
        if (p.name.toLowerCase().includes(lowerKeyword)) return true;
        // 搜索描述
        if (p.description && p.description.toLowerCase().includes(lowerKeyword)) return true;
        // 搜索标签
        if (p.tags && p.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))) return true;
        // 搜索参数名称和描述
        if (p.arguments && p.arguments.some(arg => {
          if (arg.name.toLowerCase().includes(lowerKeyword)) return true;
          if (arg.description && arg.description.toLowerCase().includes(lowerKeyword)) return true;
          return false;
        })) return true;
        
        return false;
      });
    }
    
    // 按类别过滤
    if (category) {
      filteredPrompts = filteredPrompts.filter(p => p.category === category);
    }
    
    // 按标签过滤
    if (tags && Array.isArray(tags) && tags.length > 0) {
      filteredPrompts = filteredPrompts.filter(p => {
        if (!p.tags || p.tags.length === 0) return false;
        // 检查是否包含任一标签
        return tags.some(t => p.tags && p.tags.includes(t));
      });
    }
    
    // 计算分页信息
    const total = filteredPrompts.length;
    const totalPages = Math.ceil(total / pageSize);
    
    // 验证页码
    const validPage = Math.max(1, Math.min(page, totalPages || 1));
    
    // 切片获取当前页的数据
    const startIndex = (validPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPrompts = filteredPrompts.slice(startIndex, endIndex);
    
    // 返回分页结果
    return {
      prompts: paginatedPrompts,
      total,
      page: validPage,
      pageSize,
      totalPages
    };
  }
  
  /**
   * 获取提示词详情
   * @param promptName 提示词名称
   * @returns 提示词详情或null（如果不存在）
   */
  getPromptDetails(promptName: string): LoadedPrompt | null {
    return this.loadedPrompts.find(p => p.name === promptName) || null;
  }
  
  /**
   * 获取所有标签及其使用频率
   * @returns 标签及频率对象，键为标签名称，值为使用次数
   */
  getAllTags(): { [tag: string]: number } {
    const tagCounts: { [tag: string]: number } = {};
    
    this.loadedPrompts.forEach(prompt => {
      if (prompt.tags && Array.isArray(prompt.tags)) {
        prompt.tags.forEach(tag => {
          if (tag) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          }
        });
      }
    });
    
    return tagCounts;
  }
  
  /**
   * 获取所有类别及其使用频率
   * @returns 类别及频率对象，键为类别名称，值为使用次数
   */
  getAllCategories(): { [category: string]: number } {
    const categoryCounts: { [category: string]: number } = {};
    
    this.loadedPrompts.forEach(prompt => {
      if (prompt.category) {
        categoryCounts[prompt.category] = (categoryCounts[prompt.category] || 0) + 1;
      }
    });
    
    return categoryCounts;
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
    
    // 添加时间戳
    const now = new Date().toISOString();
    prompt.createdAt = now;
    prompt.updatedAt = now;
    
    // 如果没有设置类别，设置为默认类别
    if (!prompt.category) {
      prompt.category = PromptCategory.OTHER;
    }
    
    // 确保标签是数组
    if (prompt.tags && !Array.isArray(prompt.tags)) {
      prompt.tags = [String(prompt.tags)];
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
    
    // 更新时间戳
    const now = new Date().toISOString();
    updatedPrompt.updatedAt = now;
    
    // 确保标签是数组
    if (updatedPrompt.tags && !Array.isArray(updatedPrompt.tags)) {
      updatedPrompt.tags = [String(updatedPrompt.tags)];
    }

    // 合并更新
    const mergedPrompt: LoadedPrompt = {
      ...existingPrompt,
      ...updatedPrompt,
      name: updatedPrompt.name || existingPrompt.name, // 确保name字段存在
      createdAt: existingPrompt.createdAt || now // 保留原始创建时间
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
  
  /**
   * 导出提示词
   * @param names 要导出的提示词名称数组，如果为空则导出所有提示词
   * @param category 可选的类别过滤
   * @param tags 可选的标签过滤
   * @returns 导出的提示词数组
   */
  exportPrompts(names?: string[], category?: PromptCategory, tags?: PromptTag[]): LoadedPrompt[] {
    let promptsToExport: LoadedPrompt[] = [];
    
    // 如果指定了名称，则根据名称过滤
    if (names && names.length > 0) {
      promptsToExport = this.loadedPrompts.filter(p => names.includes(p.name));
    } else {
      // 否则导出所有提示词，可能根据类别和标签过滤
      promptsToExport = [...this.loadedPrompts];
    }
    
    // 按类别过滤
    if (category) {
      promptsToExport = promptsToExport.filter(p => p.category === category);
    }
    
    // 按标签过滤
    if (tags && tags.length > 0) {
      promptsToExport = promptsToExport.filter(p => {
        if (!p.tags || p.tags.length === 0) return false;
        return tags.some(tag => p.tags?.includes(tag));
      });
    }
    
    return promptsToExport;
  }
  
  /**
   * 批量导入提示词
   * @param prompts 要导入的提示词数组
   * @param overwrite 是否覆盖现有提示词，默认为 false
   * @returns 操作结果
   */
  async importPrompts(prompts: LoadedPrompt[], overwrite: boolean = false): Promise<ToolOutput> {
    if (!prompts || prompts.length === 0) {
      return {
        content: [{ type: "text", text: "No prompts to import." }],
        isError: true
      };
    }
    
    const results = {
      success: 0,
      skipped: 0,
      failed: 0,
      details: [] as string[]
    };
    
    // 当前提示词名称集合，用于快速检查是否存在
    const existingPromptNames = new Set(this.loadedPrompts.map(p => p.name));
    
    // 处理每个提示词
    for (const prompt of prompts) {
      // 验证提示词
      if (!prompt.name) {
        results.failed++;
        results.details.push(`Skipped a prompt without a name.`);
        continue;
      }
      
      if (!prompt.messages || !Array.isArray(prompt.messages) || prompt.messages.length === 0) {
        results.failed++;
        results.details.push(`Skipped prompt '${prompt.name}': No messages defined.`);
        continue;
      }
      
      // 检查是否存在
      const exists = existingPromptNames.has(prompt.name);
      
      if (exists && !overwrite) {
        results.skipped++;
        results.details.push(`Skipped existing prompt '${prompt.name}'. Use overwrite=true to replace.`);
        continue;
      }
      
      // 添加时间戳
      const now = new Date().toISOString();
      if (!prompt.createdAt) {
        prompt.createdAt = now;
      }
      prompt.updatedAt = now;
      
      // 如果没有设置类别，设置为默认类别
      if (!prompt.category) {
        prompt.category = PromptCategory.OTHER;
      }
      
      // 确保标签是数组
      if (prompt.tags && !Array.isArray(prompt.tags)) {
        prompt.tags = [String(prompt.tags)];
      }
      
      try {
        // 根据是否存在选择添加或更新
        let success: boolean;
        if (exists) {
          // 确保 prompt 是 LoadedPrompt 类型，已经有 name 属性
          success = await this.storage.updatePrompt(prompt.name, prompt as LoadedPrompt);
        } else {
          success = await this.storage.addPrompt(prompt);
        }
        
        if (success) {
          results.success++;
          results.details.push(`${exists ? 'Updated' : 'Added'} prompt '${prompt.name}' successfully.`);
        } else {
          results.failed++;
          results.details.push(`Failed to ${exists ? 'update' : 'add'} prompt '${prompt.name}'.`);
        }
      } catch (error) {
        results.failed++;
        results.details.push(`Error ${exists ? 'updating' : 'adding'} prompt '${prompt.name}': ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // 重新加载提示词
    await this.loadAllPrompts();
    
    // 构建结果消息
    const resultText = `Import summary:\n` +
      `- Successfully imported: ${results.success}\n` +
      `- Skipped: ${results.skipped}\n` +
      `- Failed: ${results.failed}\n` +
      `- Total prompts now: ${this.loadedPrompts.length}\n\n` +
      `Details:\n${results.details.map(d => `- ${d}`).join('\n')}`;
    
    return {
      content: [{ type: "text", text: resultText }],
      isError: results.success === 0 // 如果没有成功导入任何提示词，则返回错误
    };
  }
  
  /**
   * 批量更新提示词属性
   * @param names 要更新的提示词名称数组
   * @param updates 要更新的属性
   * @returns 操作结果
   */
  async batchUpdatePrompts(names: string[], updates: Partial<Prompt>): Promise<ToolOutput> {
    if (!names || names.length === 0) {
      return {
        content: [{ type: "text", text: "No prompts specified for update." }],
        isError: true
      };
    }
    
    if (Object.keys(updates).length === 0) {
      return {
        content: [{ type: "text", text: "No updates specified." }],
        isError: true
      };
    }
    
    const results = {
      success: 0,
      notFound: 0,
      failed: 0,
      details: [] as string[]
    };
    
    // 处理每个提示词
    for (const name of names) {
      // 查找提示词
      const prompt = this.loadedPrompts.find(p => p.name === name);
      
      if (!prompt) {
        results.notFound++;
        results.details.push(`Prompt '${name}' not found.`);
        continue;
      }
      
      // 更新时间戳
      const now = new Date().toISOString();
      const updatedPrompt: Partial<Prompt> = {
        ...updates,
        updatedAt: now
      };
      
      // 确保标签是数组
      if (updatedPrompt.tags && !Array.isArray(updatedPrompt.tags)) {
        updatedPrompt.tags = [String(updatedPrompt.tags)];
      }
      
      try {
        // 使用类型断言确保类型安全
        // 我们知道 name 已经存在，所以这里的类型转换是安全的
        const success = await this.storage.updatePrompt(name, updatedPrompt as LoadedPrompt);
        
        if (success) {
          results.success++;
          results.details.push(`Updated prompt '${name}' successfully.`);
        } else {
          results.failed++;
          results.details.push(`Failed to update prompt '${name}'.`);
        }
      } catch (error) {
        results.failed++;
        results.details.push(`Error updating prompt '${name}': ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // 重新加载提示词
    await this.loadAllPrompts();
    
    // 构建结果消息
    const resultText = `Batch update summary:\n` +
      `- Successfully updated: ${results.success}\n` +
      `- Not found: ${results.notFound}\n` +
      `- Failed: ${results.failed}\n\n` +
      `Details:\n${results.details.map(d => `- ${d}`).join('\n')}`;
    
    return {
      content: [{ type: "text", text: resultText }],
      isError: results.success === 0 // 如果没有成功更新任何提示词，则返回错误
    };
  }
}
