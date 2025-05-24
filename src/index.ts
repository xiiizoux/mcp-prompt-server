/**
 * MCP Prompt Server - MCP 工具实现
 */
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 导入存储适配器
import * as vercelAdapter from './storage/vercel-adapter';
import * as supabaseAdapter from './storage/supabase-adapter';

// 检查环境
const isVercel = process.env.VERCEL === '1';
const storageType = process.env.STORAGE_TYPE || 'file';
const forceLocalStorage = process.env.FORCE_LOCAL_STORAGE === 'true';

// 确定存储方式
const useSupabase = !forceLocalStorage && 
                   storageType === 'supabase' && 
                   supabaseAdapter.isSupabaseConfigured();

console.log(`存储方式: ${useSupabase ? 'Supabase' : '文件系统'}`);
console.log(`运行环境: ${isVercel ? 'Vercel' : '本地'}`);

// 如果在 Vercel 环境中但不使用 Supabase，则显示警告
if (isVercel && !useSupabase) {
  console.warn('警告: 在 Vercel 环境中使用内存存储，提示词数据将不会持久化');
}

// 提示词接口定义
export interface Prompt {
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  messages: {
    role: string;
    content: any; // 使用 any 类型以支持复杂的内容结构
  }[];
  createdAt?: string;
  updatedAt?: string;
}

// 存储提示词的内存对象
let prompts: Record<string, Prompt> = {};

// 获取提示词目录路径
export function getPromptsDir(): string {
  return path.join(process.cwd(), 'src', 'prompts');
}

// 获取模板目录路径
export function getTemplatesDir(): string {
  return path.join(process.cwd(), 'src', 'templates');
}

// 加载提示词
export async function loadPrompts(): Promise<void> {
  // 如果使用 Supabase
  if (useSupabase) {
    console.log('使用 Supabase 存储');
    try {
      await supabaseAdapter.initDefaultPrompts();
      prompts = await supabaseAdapter.getAllPrompts();
      console.log(`已从 Supabase 加载 ${Object.keys(prompts).length} 个提示词`);
    } catch (err: any) {
      console.error('从 Supabase 加载提示词失败:', err.message || err);
    }
    return;
  }
  
  // 如果在 Vercel 环境中，使用内存存储
  if (isVercel) {
    console.log('在 Vercel 环境中运行，使用内存存储');
    vercelAdapter.initDefaultPrompts();
    prompts = vercelAdapter.getAllPrompts();
    console.log(`已加载 ${Object.keys(prompts).length} 个默认提示词`);
    return;
  }
  
  // 在本地环境中，使用文件系统
  try {
    const promptsDir = getPromptsDir();
    console.log(`加载提示词目录: ${promptsDir}`);
    const files = fs.readdirSync(promptsDir);
    
    prompts = {}; // 清空当前提示词
    
    // 加载每个 YAML 提示词文件
    for (const file of files) {
      if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        try {
          const content = fs.readFileSync(path.join(promptsDir, file), 'utf8');
          const data = yaml.parse(content) as Prompt;
          
          if (data && data.name) {
            prompts[data.name] = {
              ...data,
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          }
        } catch (err) {
          console.error(`无法解析提示词文件 ${file}:`, err);
        }
      }
    }
    
    console.log(`已加载 ${Object.keys(prompts).length} 个提示词`);
  } catch (err) {
    console.error('加载提示词失败:', err);
  }
}

// 初始化时加载提示词
loadPrompts();

// 导出用于 API 的函数

// 获取所有提示词名称
export async function getPromptNames() {
  // 如果使用 Supabase
  if (useSupabase) {
    const supabasePrompts = await supabaseAdapter.getAllPrompts();
    return Object.keys(supabasePrompts);
  }
  
  // 如果在 Vercel 环境中，使用内存存储
  if (isVercel) {
    return Object.keys(vercelAdapter.getAllPrompts());
  }
  
  // 在本地环境中，使用内存对象
  return Object.keys(prompts);
}

// 获取提示词详情
export async function getPromptDetails(name: string) {
  if (!name) {
    throw new Error('缺少提示词名称');
  }
  
  // 如果使用 Supabase
  if (useSupabase) {
    const prompt = await supabaseAdapter.getPrompt(name);
    if (!prompt) {
      throw new Error(`提示词 '${name}' 不存在`);
    }
    return prompt;
  }
  
  // 如果在 Vercel 环境中，使用内存存储
  if (isVercel) {
    const prompt = vercelAdapter.getPrompt(name);
    if (!prompt) {
      throw new Error(`提示词 '${name}' 不存在`);
    }
    return prompt;
  }
  
  // 在本地环境中，使用内存对象
  if (!prompts[name]) {
    throw new Error(`提示词 '${name}' 不存在`);
  }
  return prompts[name];
}

// 默认提示词模板
const DEFAULT_PROMPT_TEMPLATE = `name: prompt_name
description: 提示词的描述
category: 提示词类别
tags:
  - 标签1
  - 标签2
arguments:
  - name: parameter1
    description: 参数一的描述
    required: true
  - name: parameter2
    description: 参数二的描述
    required: false
messages:
  - role: user
    content:
      type: text
      text: |
        这里是提示词的主要内容。
        
        可以包含参数，如 {{parameter1}} 和 {{parameter2}}。
        
        可以使用多行文本和格式化。`;

// 获取提示词模板
export function getPromptTemplate() {
  // 如果使用 Supabase 或在 Vercel 环境中，返回默认模板
  if (useSupabase || isVercel) {
    return DEFAULT_PROMPT_TEMPLATE;
  }
  
  // 在本地环境中，从文件读取
  try {
    const templatePath = path.join(getTemplatesDir(), 'prompt_template.yaml');
    return fs.readFileSync(templatePath, 'utf8');
  } catch (err) {
    console.warn('无法读取模板文件，使用默认模板');
    return DEFAULT_PROMPT_TEMPLATE;
  }
}

// 创建新提示词
export async function createPrompt(name: string, content: string) {
  if (!name || !content) {
    throw new Error('缺少提示词名称或内容');
  }
  
  // 解析 YAML 内容
  let promptData;
  try {
    promptData = yaml.parse(content);
  } catch (parseErr) {
    throw new Error(`YAML 解析失败: ${parseErr}`);
  }
  
  // 验证提示词数据
  if (!promptData.name || !promptData.messages || !Array.isArray(promptData.messages)) {
    throw new Error('提示词格式无效: 缺少必要字段 (name, messages)');
  }
  
  // 确保提示词名称与文件名一致
  promptData.name = name;
  
  // 添加时间戳
  promptData.createdAt = new Date().toISOString();
  promptData.updatedAt = new Date().toISOString();
  
  // 如果使用 Supabase
  if (useSupabase) {
    await supabaseAdapter.savePrompt(name, promptData);
    prompts = await supabaseAdapter.getAllPrompts();
    return promptData;
  }
  
  // 如果在 Vercel 环境中，使用内存存储
  if (isVercel) {
    vercelAdapter.savePrompt(name, promptData);
    prompts = vercelAdapter.getAllPrompts();
    return promptData;
  }
  
  // 在本地环境中，写入文件
  const promptsDir = getPromptsDir();
  const filePath = path.join(promptsDir, `${name}.yaml`);
  
  // 将对象转换回 YAML
  const yamlContent = yaml.stringify(promptData);
  fs.writeFileSync(filePath, yamlContent, 'utf8');
  
  // 重新加载提示词
  await loadPrompts();
  
  return promptData;
}

// MCP 工具函数
export const mcpTools = {
  // 获取所有提示词名称
  get_prompt_names: async () => {
    try {
      const names = await getPromptNames();
      return {
        status: 'success',
        data: names
      };
    } catch (err: any) {
      return {
        status: 'error',
        message: `获取提示词名称失败: ${err.message || err}`
      };
    }
  },
  
  // 获取提示词详情
  get_prompt_details: async (params: { name: string }) => {
    const { name } = params;
    
    if (!name) {
      return {
        status: 'error',
        message: '缺少提示词名称'
      };
    }
    
    try {
      const promptData = await getPromptDetails(name);
      return {
        status: 'success',
        data: promptData
      };
    } catch (err: any) {
      return {
        status: 'error',
        message: err.message || `获取提示词详情失败`
      };
    }
  },
  
  // 重新加载提示词
  reload_prompts: async () => {
    try {
      await loadPrompts();
      return {
        status: 'success',
        message: `已重新加载 ${Object.keys(prompts).length} 个提示词`
      };
    } catch (err: any) {
      return {
        status: 'error',
        message: `重新加载提示词失败: ${err.message || err}`
      };
    }
  },
  
  // 获取提示词模板
  get_prompt_template: async () => {
    try {
      const templateContent = getPromptTemplate();
      return {
        status: 'success',
        data: templateContent
      };
    } catch (err: any) {
      return {
        status: 'error',
        message: `获取提示词模板失败: ${err.message || err}`
      };
    }
  },
  
  // 创建新提示词
  create_prompt: async (params: { name: string, content: string }) => {
    const { name, content } = params;
    
    if (!name || !content) {
      return {
        status: 'error',
        message: '缺少提示词名称或内容'
      };
    }
    
    try {
      // 如果使用 Supabase，直接创建提示词，因为 Supabase 会处理重复问题
      if (!useSupabase) {
        // 在非 Supabase 环境中，检查提示词名称是否已存在
        if (prompts[name]) {
          return {
            status: 'error',
            message: `提示词 '${name}' 已存在`
          };
        }
      }
      
      const promptData = await createPrompt(name, content);
      
      return {
        status: 'success',
        message: `提示词 '${name}' 创建成功`,
        data: promptData
      };
    } catch (err: any) {
      return {
        status: 'error',
        message: err.message || `创建提示词失败`
      };
    }
  }
};

// 导出工具描述
export const toolDescriptions = [
  {
    name: 'get_prompt_names',
    description: '获取所有可用的提示词名称',
    parameters: {}
  },
  {
    name: 'get_prompt_details',
    description: '获取指定提示词的详细信息',
    parameters: {
      name: {
        type: 'string',
        description: '提示词名称'
      }
    }
  },
  {
    name: 'reload_prompts',
    description: '重新加载所有提示词',
    parameters: {}
  },
  {
    name: 'get_prompt_template',
    description: '获取提示词 YAML 模板',
    parameters: {}
  },
  {
    name: 'create_prompt',
    description: '创建新的提示词并保存为 YAML 文件',
    parameters: {
      name: {
        type: 'string',
        description: '提示词名称，将用作文件名'
      },
      content: {
        type: 'string',
        description: '提示词的 YAML 格式内容'
      }
    }
  }
];

// 如果直接运行此文件，输出工具信息
if (require.main === module) {
  console.log('MCP Prompt Server 工具已加载');
  console.log(`可用工具: ${Object.keys(mcpTools).join(', ')}`);
}
