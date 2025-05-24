/**
 * 文件系统存储实现
 * 使用本地文件系统存储提示词
 */

import fs from 'fs-extra';
import path from 'path';
import YAML from 'yaml';
import { Prompt, LoadedPrompt } from '../types.js';
import { StorageInterface } from './interface.js';

export class FileSystemStorage implements StorageInterface {
  private promptsDir: string;

  constructor(promptsDir: string) {
    this.promptsDir = promptsDir;
  }

  /**
   * 确保提示词目录存在
   */
  private async ensurePromptsDir(): Promise<void> {
    await fs.ensureDir(this.promptsDir);
  }

  /**
   * 查找提示词文件
   * @param promptName 提示词名称
   * @returns 文件路径，如果不存在则返回null
   */
  private async findPromptFile(promptName: string): Promise<string | null> {
    const extensions = ['.yaml', '.yml'];
    for (const ext of extensions) {
      const filePath = path.join(this.promptsDir, promptName + ext);
      if (await fs.pathExists(filePath)) {
        return filePath;
      }
    }
    return null;
  }

  /**
   * 获取所有提示词
   */
  async getAllPrompts(): Promise<LoadedPrompt[]> {
    try {
      await this.ensurePromptsDir();
      const files = await fs.readdir(this.promptsDir);
      const promptFiles = files.filter(file =>
        file.endsWith('.yaml') || file.endsWith('.yml')
      );

      const prompts: LoadedPrompt[] = [];
      for (const file of promptFiles) {
        const filePath = path.join(this.promptsDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        let prompt: Prompt;

        prompt = YAML.parse(content) as Prompt;

        if (!prompt.name) {
          console.warn(`Warning: Prompt in ${file} is missing a name field. Skipping.`);
          continue;
        }
        prompts.push(prompt as LoadedPrompt);
      }
      return prompts;
    } catch (error: any) {
      console.error('Error loading prompts from files:', error.message);
      return []; // 错误时返回空数组
    }
  }

  /**
   * 根据名称获取提示词
   */
  async getPromptByName(name: string): Promise<LoadedPrompt | null> {
    const filePath = await this.findPromptFile(name);
    if (!filePath) {
      return null;
    }

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const prompt = YAML.parse(content) as Prompt;
      
      if (!prompt.name) {
        prompt.name = name;
      }
      
      return prompt as LoadedPrompt;
    } catch (error: any) {
      console.error(`Error reading prompt '${name}':`, error.message);
      return null;
    }
  }

  /**
   * 添加新提示词
   */
  async addPrompt(prompt: LoadedPrompt): Promise<boolean> {
    try {
      await this.ensurePromptsDir();
      
      // 检查提示词是否已存在
      const existingPrompt = await this.findPromptFile(prompt.name);
      if (existingPrompt) {
        return false; // 提示词已存在
      }
      
      // 写入新提示词文件
      const filePath = path.join(this.promptsDir, `${prompt.name}.yaml`);
      await fs.writeFile(filePath, YAML.stringify(prompt), 'utf8');
      
      return true;
    } catch (error: any) {
      console.error(`Error adding prompt '${prompt.name}':`, error.message);
      return false;
    }
  }

  /**
   * 更新提示词
   */
  async updatePrompt(name: string, prompt: LoadedPrompt): Promise<boolean> {
    try {
      const filePath = await this.findPromptFile(name);
      if (!filePath) {
        return false; // 提示词不存在
      }
      
      // 写入更新后的提示词
      await fs.writeFile(filePath, YAML.stringify(prompt), 'utf8');
      
      return true;
    } catch (error: any) {
      console.error(`Error updating prompt '${name}':`, error.message);
      return false;
    }
  }

  /**
   * 删除提示词
   */
  async deletePrompt(name: string): Promise<boolean> {
    try {
      const filePath = await this.findPromptFile(name);
      if (!filePath) {
        return false; // 提示词不存在
      }
      
      // 删除提示词文件
      await fs.remove(filePath);
      
      return true;
    } catch (error: any) {
      console.error(`Error deleting prompt '${name}':`, error.message);
      return false;
    }
  }
}
