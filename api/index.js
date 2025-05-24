// MCP Prompt Server - Vercel API 入口点
const express = require('express');
const cors = require('cors');
const { json } = require('body-parser');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 加载环境变量
require('dotenv').config();

// 检查环境配置
const storageType = process.env.STORAGE_TYPE || 'file';
const forceLocalStorage = process.env.FORCE_LOCAL_STORAGE === 'true';
const isVercel = process.env.VERCEL === '1';

// 初始化 Supabase 客户端
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// 确定存储方式和身份验证
const useSupabase = !forceLocalStorage && 
                   storageType === 'supabase' && 
                   supabaseUrl && supabaseKey;

console.log(`API 存储方式: ${useSupabase ? 'Supabase' : '文件系统'}`);
console.log(`API 运行环境: ${isVercel ? 'Vercel' : '本地'}`);
console.log(`API 身份验证: ${useSupabase ? '已启用' : '未启用'}`);

// 如果在 Vercel 环境中但不使用 Supabase，则显示警告
if (isVercel && !useSupabase) {
  console.warn('警告: 在 Vercel 环境中使用内存存储，提示词数据将不会持久化');
}

// 导入核心功能
// 注意：需要先构建 TypeScript 代码，然后才能导入
// 这里假设已经运行了 npm run build
const { 
  mcpTools
} = require('../dist/src/index');

// 初始化 Express 应用
const app = express();

// 中间件
app.use(cors());
app.use(json());

// 身份验证中间件
const authMiddleware = async (req, res, next) => {
  // 跳过健康检查端点的身份验证
  if (req.path === '/api/health' || !useSupabase) {
    return next();
  }
  
  // 从请求头中获取 JWT
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      status: 'error', 
      message: '未提供身份验证令牌' 
    });
  }
  
  try {
    // 验证 JWT
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ 
        status: 'error', 
        message: '无效的身份验证令牌' 
      });
    }
    
    // 将用户信息添加到请求对象
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ 
      status: 'error', 
      message: '身份验证失败' 
    });
  }
};

// 如果使用 Supabase，应用身份验证中间件
if (useSupabase) {
  app.use('/api/get_prompt_names', authMiddleware);
  app.use('/api/get_prompt_details', authMiddleware);
  app.use('/api/reload_prompts', authMiddleware);
  app.use('/api/get_prompt_template', authMiddleware);
  app.use('/api/create_prompt', authMiddleware);
}

// API 路由
app.post('/api/get_prompt_names', async (_req, res) => {
  try {
    const result = await mcpTools.get_prompt_names();
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message || '获取提示词名称失败' });
  }
});

app.post('/api/get_prompt_details', async (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ status: 'error', message: '缺少提示词名称' });
  }
  
  try {
    const result = await mcpTools.get_prompt_details({ name });
    res.json(result);
  } catch (err) {
    res.status(404).json({ status: 'error', message: err.message || '获取提示词详情失败' });
  }
});

app.post('/api/reload_prompts', async (_req, res) => {
  try {
    const result = await mcpTools.reload_prompts();
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message || '重新加载提示词失败' });
  }
});

app.post('/api/get_prompt_template', async (_req, res) => {
  try {
    const result = await mcpTools.get_prompt_template();
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message || '获取提示词模板失败' });
  }
});

app.post('/api/create_prompt', async (req, res) => {
  const { name, content } = req.body;
  
  if (!name || !content) {
    return res.status(400).json({ status: 'error', message: '缺少提示词名称或内容' });
  }
  
  try {
    const result = await mcpTools.create_prompt({ name, content });
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message || '创建提示词失败' });
  }
});

// 身份验证相关的 API 端点
if (useSupabase) {
  // 登录端点
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        status: 'error', 
        message: '缺少电子邮件或密码' 
      });
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        return res.status(401).json({ 
          status: 'error', 
          message: error.message 
        });
      }
      
      res.json({ 
        status: 'success', 
        data: {
          user: data.user,
          session: data.session
        }
      });
    } catch (err) {
      res.status(500).json({ 
        status: 'error', 
        message: '登录失败' 
      });
    }
  });

  // 注册端点
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, displayName } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        status: 'error', 
        message: '缺少电子邮件或密码' 
      });
    }
    
    try {
      // 创建用户
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0]
          }
        }
      });
      
      if (authError) {
        return res.status(400).json({ 
          status: 'error', 
          message: authError.message 
        });
      }
      
      // 如果需要，可以在用户表中添加额外信息
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: email,
            display_name: displayName || email.split('@')[0]
          });
        
        if (profileError) {
          console.error('创建用户资料失败:', profileError);
        }
      }
      
      res.json({ 
        status: 'success', 
        message: '注册成功，请检查您的电子邮件进行验证',
        data: {
          user: authData.user
        }
      });
    } catch (err) {
      res.status(500).json({ 
        status: 'error', 
        message: '注册失败' 
      });
    }
  });

  // 注销端点
  app.post('/api/auth/logout', authMiddleware, async (req, res) => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return res.status(500).json({ 
          status: 'error', 
          message: error.message 
        });
      }
      
      res.json({ 
        status: 'success', 
        message: '已成功注销' 
      });
    } catch (err) {
      res.status(500).json({ 
        status: 'error', 
        message: '注销失败' 
      });
    }
  });
}

// 健康检查端点
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    version: '1.0.0',
    supabase: useSupabase ? 'enabled' : 'disabled'
  });
});

// 处理根路径请求
app.get('/', (_req, res) => {
  const endpoints = [
    '/api/get_prompt_names',
    '/api/get_prompt_details',
    '/api/reload_prompts',
    '/api/get_prompt_template',
    '/api/create_prompt',
    '/api/health'
  ];
  
  if (useSupabase) {
    endpoints.push(
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/logout'
    );
  }
  
  res.json({ 
    name: 'MCP Prompt Server API',
    description: '提供提示词管理功能的 API',
    endpoints: endpoints,
    auth: useSupabase ? 'Supabase' : 'None'
  });
});

// 导出 Express 应用，Vercel 会自动处理
module.exports = app;
