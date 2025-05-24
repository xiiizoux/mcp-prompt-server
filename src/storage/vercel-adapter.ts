/**
 * Vercel 环境适配器
 * 用于在 Vercel 无服务器环境中处理存储操作
 */
import { Prompt } from '../index';

// 内存存储
let memoryPrompts: Record<string, Prompt> = {};

// 检查是否在 Vercel 环境中
export function isVercelEnvironment(): boolean {
  return process.env.VERCEL === '1';
}

// 获取所有提示词
export function getAllPrompts(): Record<string, Prompt> {
  return memoryPrompts;
}

// 获取提示词
export function getPrompt(name: string): Prompt | null {
  return memoryPrompts[name] || null;
}

// 保存提示词
export function savePrompt(name: string, prompt: Prompt): void {
  memoryPrompts[name] = {
    ...prompt,
    updatedAt: new Date().toISOString()
  };
}

// 删除提示词
export function deletePrompt(name: string): boolean {
  if (memoryPrompts[name]) {
    delete memoryPrompts[name];
    return true;
  }
  return false;
}

// 初始化默认提示词
export function initDefaultPrompts(): void {
  // 这里可以添加一些默认的提示词
  const defaultPrompts: Record<string, Prompt> = {
    general_assistant: {
      name: 'general_assistant',
      description: '通用助手提示词，用于日常对话和问答',
      category: '通用',
      tags: ['对话', '助手', '基础'],
      messages: [
        {
          role: 'system',
          content: '你是一个有用的AI助手，能够回答用户的各种问题并提供帮助。'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    code_assistant: {
      name: 'code_assistant',
      description: '代码助手提示词，用于编程和代码相关问题',
      category: '编程',
      tags: ['代码', '编程', '开发'],
      messages: [
        {
          role: 'system',
          content: '你是一个专业的编程助手，能够帮助用户解决各种编程问题，提供代码示例和解释。'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  };
  
  memoryPrompts = { ...defaultPrompts };
}
