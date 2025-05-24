import { McpServer } from '@mcp/protocol';
import { StorageFactory, StorageType } from './storage/storage-factory.js';
import { PromptService } from './core/prompt-service.js';

// 导入注册工具函数
// 注意：需要在 index.js 中导出 registerManagementTools 函数
import * as index from './index.js';

/**
 * Cloudflare Workers 配置接口
 */
interface Env {
  // KV 命名空间
  PROMPTS_KV: KVNamespace;
}

/**
 * 创建 MCP 服务器实例
 * @param env Cloudflare Workers 环境变量
 * @returns MCP 服务器实例
 */
async function createServer(env: Env): Promise<McpServer> {
  // 创建存储实例
  const storage = StorageFactory.createStorage(StorageType.CLOUDFLARE_KV, {
    namespace: env.PROMPTS_KV
  });
  
  // 初始化存储
  await storage.initialize();
  
  // 创建提示词服务
  const promptService = new PromptService(storage);
  
  // 创建 MCP 服务器
  const server = new McpServer();
  
  // 注册工具
  index.registerManagementTools(server, promptService);
  
  return server;
}

/**
 * Cloudflare Workers 请求处理函数
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // 只处理 POST 请求
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }
    
    try {
      // 创建服务器
      const server = await createServer(env);
      
      // 获取请求内容
      const content = await request.json();
      
      // 处理请求
      const result = await server.handleRequest(content);
      
      // 返回结果
      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error handling request:', error);
      
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : String(error)
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }
};
