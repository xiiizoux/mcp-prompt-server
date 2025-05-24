/**
 * MCP Prompt Server - 简化版服务器
 */
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

// 加载环境变量
dotenv.config();

// 提示词接口定义
interface Prompt {
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  messages: {
    role: string;
    content: string;
  }[];
  createdAt?: string;
  updatedAt?: string;
}

// 存储提示词的内存对象
let prompts: Record<string, Prompt> = {};

// 创建 Express 应用
const app = express();
const PORT = process.env.PORT || 9011;

// 加载提示词
function loadPrompts(): void {
  try {
    const promptsDir = path.join(__dirname, 'src', 'prompts');
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

// 中间件
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// 初始化时加载提示词
loadPrompts();

// API 路由

// 获取所有提示词名称
app.post('/api/get_prompt_names', (_req: Request, res: Response) => {
  res.json({ status: 'success', data: Object.keys(prompts) });
});

// 获取提示词详情
app.post('/api/get_prompt_details', (req: Request, res: Response) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ status: 'error', message: '缺少提示词名称' });
  }
  
  const prompt = prompts[name];
  if (!prompt) {
    return res.status(404).json({ status: 'error', message: `提示词 '${name}' 不存在` });
  }
  
  res.json({ status: 'success', data: prompt });
});

// 重新加载提示词
app.post('/api/reload_prompts', (_req: Request, res: Response) => {
  loadPrompts();
  res.json({ status: 'success', message: `已重新加载 ${Object.keys(prompts).length} 个提示词` });
});

// API 文档路由
app.get('/', (_req: Request, res: Response) => {
  res.send('MCP Prompt Server API - 使用 POST 请求访问 API 端点');
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`MCP Prompt Server 正在运行，端口: ${PORT}`);
  console.log('可用的 API 端点:');
  console.log(`- GET /: API 文档`);
  console.log(`- POST /api/get_prompt_names: 获取所有提示词名称`);
  console.log(`- POST /api/get_prompt_details: 获取提示词详情`);
  console.log(`- POST /api/reload_prompts: 重新加载提示词`);
});
