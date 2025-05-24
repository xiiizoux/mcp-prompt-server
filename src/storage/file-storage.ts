import fs from 'fs-extra';
import path from 'path';
import YAML from 'yaml';
import { LoadedPrompt } from '../types.js';
import { StorageInterface } from './storage-interface.js';
import { StorageError, logger, asyncErrorHandler } from '../utils/error-handler.js';

/**
 * 文件存储实现
 * 使用文件系统存储提示词
 */
export class FileStorage implements StorageInterface {
  private promptsDir: string;
  private promptsFile: string;

  /**
   * 创建文件存储实例
   * @param options 存储选项
   */
  constructor(options: { promptsDir: string; promptsFile: string }) {
    this.promptsDir = options.promptsDir || './prompts';
    this.promptsFile = options.promptsFile || 'prompts.json';
  }

  /**
   * 初始化存储
   * 确保提示词目录存在
   */
  async initialize(): Promise<void> {
    try {
      await fs.ensureDir(this.promptsDir);
      logger.info(`初始化文件存储，目录: ${this.promptsDir}`);
    } catch (error) {
      logger.error('初始化文件存储失败', error as Error);
      throw new StorageError(`无法创建提示词目录: ${this.promptsDir}`, { error });
    }
  }

  /**
   * 加载所有提示词
   * 优先从 prompts.json 文件加载，如果不存在则从 YAML 文件加载
   */
  async loadAllPrompts(): Promise<LoadedPrompt[]> {
    try {
      const promptsFilePath = path.join(this.promptsDir, this.promptsFile);
      
      // 如果存在 prompts.json 文件，直接从中加载所有提示词
      if (await fs.pathExists(promptsFilePath)) {
        logger.info(`从文件加载提示词: ${promptsFilePath}`);
        const promptsData = await fs.readFile(promptsFilePath, 'utf8');
        return JSON.parse(promptsData);
      }
      
      // 否则，从目录中的 YAML 文件加载提示词
      logger.info(`从目录加载提示词: ${this.promptsDir}`);
      const files = await fs.readdir(this.promptsDir);
      const promptFiles = files.filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
      
      const prompts: LoadedPrompt[] = [];
      
      for (const file of promptFiles) {
        try {
          const filePath = path.join(this.promptsDir, file);
          const fileContent = await fs.readFile(filePath, 'utf8');
          const prompt = YAML.parse(fileContent);
          prompts.push(prompt);
        } catch (error) {
          logger.warn(`解析提示词文件失败: ${file}`, error as Error);
          // 继续处理其他文件
        }
      }
      
      logger.info(`成功加载 ${prompts.length} 个提示词`);
      return prompts;
    } catch (error) {
      logger.error('加载提示词失败', error as Error);
      throw new StorageError('无法加载提示词', { error });
    }
  }

  /**
   * 添加新的提示词
   * @param prompt 要添加的提示词
   */
  async addPrompt(prompt: LoadedPrompt): Promise<boolean> {
    try {
      const promptsFilePath = path.join(this.promptsDir, this.promptsFile);
      
      // 加载现有提示词
      let prompts: LoadedPrompt[] = [];
      if (await fs.pathExists(promptsFilePath)) {
        const promptsData = await fs.readFile(promptsFilePath, 'utf8');
        prompts = JSON.parse(promptsData);
      }
      
      // 检查是否已存在同名提示词
      if (prompts.some(p => p.name === prompt.name)) {
        logger.warn(`提示词已存在: ${prompt.name}`);
        return false;
      }
      
      // 添加新提示词
      prompts.push(prompt);
      
      // 保存到文件
      await fs.writeFile(promptsFilePath, JSON.stringify(prompts, null, 2), 'utf8');
      logger.info(`添加提示词成功: ${prompt.name}`);
      
      return true;
    } catch (error) {
      logger.error(`添加提示词失败: ${prompt.name}`, error as Error);
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
      const promptsFilePath = path.join(this.promptsDir, this.promptsFile);
      
      // 加载现有提示词
      if (!await fs.pathExists(promptsFilePath)) {
        logger.warn(`提示词文件不存在: ${promptsFilePath}`);
        return false;
      }
      
      const promptsData = await fs.readFile(promptsFilePath, 'utf8');
      let prompts: LoadedPrompt[] = JSON.parse(promptsData);
      
      // 查找要更新的提示词
      const index = prompts.findIndex(p => p.name === name);
      if (index === -1) {
        logger.warn(`提示词不存在: ${name}`);
        return false;
      }
      
      // 更新提示词
      prompts[index] = updatedPrompt;
      
      // 保存到文件
      await fs.writeFile(promptsFilePath, JSON.stringify(prompts, null, 2), 'utf8');
      logger.info(`更新提示词成功: ${name}`);
      
      return true;
    } catch (error) {
      logger.error(`更新提示词失败: ${name}`, error as Error);
      throw new StorageError(`无法更新提示词: ${name}`, { error });
    }
  }

  /**
   * 删除提示词
   * @param name 要删除的提示词名称
   */
  async deletePrompt(name: string): Promise<boolean> {
    try {
      const promptsFilePath = path.join(this.promptsDir, this.promptsFile);
      
      // 加载现有提示词
      if (!await fs.pathExists(promptsFilePath)) {
        logger.warn(`提示词文件不存在: ${promptsFilePath}`);
        return false;
      }
      
      const promptsData = await fs.readFile(promptsFilePath, 'utf8');
      let prompts: LoadedPrompt[] = JSON.parse(promptsData);
      
      // 检查提示词是否存在
      const initialLength = prompts.length;
      prompts = prompts.filter(p => p.name !== name);
      
      if (prompts.length === initialLength) {
        logger.warn(`提示词不存在: ${name}`);
        return false; // 没有找到要删除的提示词
      }
      
      // 保存到文件
      await fs.writeFile(promptsFilePath, JSON.stringify(prompts, null, 2), 'utf8');
      logger.info(`删除提示词成功: ${name}`);
      
      return true;
    } catch (error) {
      logger.error(`删除提示词失败: ${name}`, error as Error);
      throw new StorageError(`无法删除提示词: ${name}`, { error });
    }
  }


}
