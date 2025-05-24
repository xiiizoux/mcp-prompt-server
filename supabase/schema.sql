-- MCP Prompt Server 数据库结构
-- 在 Supabase SQL 编辑器中执行此脚本

-- 提示词表
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[],
  messages JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户表（用于身份验证）
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加一些默认提示词
INSERT INTO prompts (name, description, category, tags, messages, created_at, updated_at)
VALUES 
  (
    'general_assistant',
    '通用助手提示词，用于日常对话和问答',
    '通用',
    ARRAY['对话', '助手', '基础'],
    '[{"role":"system","content":{"type":"text","text":"你是一个有用的AI助手，能够回答用户的各种问题并提供帮助。"}}]'::JSONB,
    NOW(),
    NOW()
  ),
  (
    'code_assistant',
    '代码助手提示词，用于编程和代码相关问题',
    '编程',
    ARRAY['代码', '编程', '开发'],
    '[{"role":"system","content":{"type":"text","text":"你是一个专业的编程助手，能够帮助用户解决各种编程问题，提供代码示例和解释。\n\n请遵循以下原则：\n1. 提供清晰、简洁的代码示例\n2. 解释代码的工作原理\n3. 指出潜在的问题和优化方向\n4. 使用最佳实践和设计模式\n\n你精通多种编程语言，包括但不限于：JavaScript、TypeScript、Python、Java、C++、Go等。"}}]'::JSONB,
    NOW(),
    NOW()
  )
ON CONFLICT (name) DO NOTHING;
