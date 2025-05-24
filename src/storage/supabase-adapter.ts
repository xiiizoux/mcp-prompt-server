/**
 * Supabase 存储适配器
 * 用于在 Vercel 环境中使用 Supabase 存储提示词数据
 */
import { createClient } from '@supabase/supabase-js';
import { Prompt } from '../index';

// 初始化 Supabase 客户端
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// 检查是否配置了 Supabase
export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseKey;
}

// 获取所有提示词
export async function getAllPrompts(): Promise<Record<string, Prompt>> {
  const { data, error } = await supabase
    .from('prompts')
    .select('*');
  
  if (error) {
    throw new Error(`获取提示词失败: ${error.message}`);
  }
  
  // 转换为 Record 格式
  const promptsRecord: Record<string, Prompt> = {};
  if (data) {
    data.forEach(prompt => {
      promptsRecord[prompt.name] = {
        name: prompt.name,
        description: prompt.description,
        category: prompt.category,
        tags: prompt.tags,
        messages: prompt.messages,
        createdAt: prompt.created_at,
        updatedAt: prompt.updated_at
      };
    });
  }
  
  return promptsRecord;
}

// 获取特定提示词
export async function getPrompt(name: string): Promise<Prompt | null> {
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('name', name)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null; // 提示词不存在
    }
    throw new Error(`获取提示词失败: ${error.message}`);
  }
  
  return {
    name: data.name,
    description: data.description,
    category: data.category,
    tags: data.tags,
    messages: data.messages,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

// 保存提示词
export async function savePrompt(name: string, prompt: Prompt): Promise<void> {
  // 检查提示词是否已存在
  const existingPrompt = await getPrompt(name);
  
  if (existingPrompt) {
    // 更新现有提示词
    const { error } = await supabase
      .from('prompts')
      .update({
        description: prompt.description,
        category: prompt.category,
        tags: prompt.tags,
        messages: prompt.messages,
        updated_at: new Date().toISOString()
      })
      .eq('name', name);
    
    if (error) {
      throw new Error(`更新提示词失败: ${error.message}`);
    }
  } else {
    // 创建新提示词
    const { error } = await supabase
      .from('prompts')
      .insert({
        name: prompt.name,
        description: prompt.description,
        category: prompt.category,
        tags: prompt.tags,
        messages: prompt.messages,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      throw new Error(`创建提示词失败: ${error.message}`);
    }
  }
}

// 删除提示词
export async function deletePrompt(name: string): Promise<boolean> {
  const { error } = await supabase
    .from('prompts')
    .delete()
    .eq('name', name);
  
  if (error) {
    throw new Error(`删除提示词失败: ${error.message}`);
  }
  
  return true;
}

// 初始化默认提示词
export async function initDefaultPrompts(): Promise<void> {
  // 检查是否已有提示词
  const { count, error } = await supabase
    .from('prompts')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    throw new Error(`检查提示词数量失败: ${error.message}`);
  }
  
  // 如果没有提示词，添加默认提示词
  if (count === 0) {
    const defaultPrompts: Prompt[] = [
      {
        name: 'general_assistant',
        description: '通用助手提示词，用于日常对话和问答',
        category: '通用',
        tags: ['对话', '助手', '基础'],
        messages: [
          {
            role: 'system',
            content: {
              type: 'text',
              text: '你是一个有用的AI助手，能够回答用户的各种问题并提供帮助。'
            }
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: 'code_assistant',
        description: '代码助手提示词，用于编程和代码相关问题',
        category: '编程',
        tags: ['代码', '编程', '开发'],
        messages: [
          {
            role: 'system',
            content: {
              type: 'text',
              text: '你是一个专业的编程助手，能够帮助用户解决各种编程问题，提供代码示例和解释。\n\n请遵循以下原则：\n1. 提供清晰、简洁的代码示例\n2. 解释代码的工作原理\n3. 指出潜在的问题和优化方向\n4. 使用最佳实践和设计模式\n\n你精通多种编程语言，包括但不限于：JavaScript、TypeScript、Python、Java、C++、Go等。'
            }
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    for (const prompt of defaultPrompts) {
      await savePrompt(prompt.name, prompt);
    }
  }
}
