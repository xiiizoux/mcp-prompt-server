/**
 * Cloudflare Workers 入口文件
 * 用于在 Cloudflare Workers 环境中部署
 */

import { PromptService } from './core/prompt-service';
import { HttpServer } from './api/http-server';
import { createStorage } from './storage/factory';

export interface Env {
  // Cloudflare KV 命名空间
  PROMPTS_KV: KVNamespace;
}

export default {
  /**
   * 处理请求
   * @param request 请求对象
   * @param env 环境变量
   * @param ctx 执行上下文
   * @returns 响应对象
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // 创建存储实例
      const storage = createStorage(env);
      
      // 创建提示词服务
      const promptService = new PromptService(storage);
      
      // 加载提示词
      await promptService.loadAllPrompts();
      
      // 创建 HTTP 服务器
      const httpServer = new HttpServer(promptService);
      
      // 处理请求
      return httpServer.handleRequest(request);
    } catch (error: any) {
      // 错误处理
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
