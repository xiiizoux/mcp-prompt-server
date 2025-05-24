/**
 * HTTP API 服务器
 * 提供 HTTP 接口，用于在 Cloudflare Workers 等环境中使用
 */

import { PromptService } from '../core/prompt-service';
import { Prompt, LoadedPrompt, ToolInputArgs } from '../types';

export class HttpServer {
  private promptService: PromptService;

  constructor(promptService: PromptService) {
    this.promptService = promptService;
  }

  /**
   * 处理 HTTP 请求
   * @param request HTTP 请求对象
   * @returns HTTP 响应对象
   */
  async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 健康检查端点
    if (path === '/health' && request.method === 'GET') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // API 端点
    if (path.startsWith('/api/')) {
      return this.handleApiRequest(request, path.substring(5));
    }
    
    // 默认响应
    return new Response('Not Found', { status: 404 });
  }
  
  /**
   * 处理 API 请求
   * @param request HTTP 请求对象
   * @param endpoint API 端点
   * @returns HTTP 响应对象
   */
  private async handleApiRequest(request: Request, endpoint: string): Promise<Response> {
    try {
      // 仅支持 POST 请求
      if (request.method !== 'POST') {
        return this.jsonResponse({ error: 'Method not allowed' }, 405);
      }
      
      // 解析请求体
      let body;
      try {
        body = await request.json();
      } catch (error) {
        return this.jsonResponse({ error: 'Invalid JSON body' }, 400);
      }
      
      // 根据端点处理请求
      switch (endpoint) {
        case 'get_prompt_names':
          return this.handleGetPromptNames();
        
        case 'reload_prompts':
          return this.handleReloadPrompts();
        
        case 'add_new_prompt':
          return this.handleAddNewPrompt(body);
        
        case 'update_prompt':
          return this.handleUpdatePrompt(body);
        
        case 'delete_prompt':
          return this.handleDeletePrompt(body);
        
        default:
          // 检查是否是提示词处理请求
          if (this.promptService.getPromptNames().includes(endpoint)) {
            return this.handleProcessPrompt(endpoint, body);
          }
          
          return this.jsonResponse({ error: 'Endpoint not found' }, 404);
      }
    } catch (error: any) {
      console.error('API error:', error);
      return this.jsonResponse({ error: error.message || 'Internal server error' }, 500);
    }
  }
  
  /**
   * 获取提示词名称列表
   */
  private async handleGetPromptNames(): Promise<Response> {
    const names = this.promptService.getPromptNames();
    return this.jsonResponse({ 
      promptNames: names,
      count: names.length
    });
  }
  
  /**
   * 重新加载提示词
   */
  private async handleReloadPrompts(): Promise<Response> {
    const prompts = await this.promptService.loadAllPrompts();
    return this.jsonResponse({ 
      message: `Successfully reloaded ${prompts.length} prompts.`,
      count: prompts.length
    });
  }
  
  /**
   * 添加新提示词
   */
  private async handleAddNewPrompt(body: any): Promise<Response> {
    if (!body || typeof body !== 'object') {
      return this.jsonResponse({ error: 'Invalid request body' }, 400);
    }
    
    if (!body.name || typeof body.name !== 'string') {
      return this.jsonResponse({ error: 'Prompt name is required' }, 400);
    }
    
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return this.jsonResponse({ error: 'Prompt messages are required' }, 400);
    }
    
    const result = await this.promptService.addPrompt(body as LoadedPrompt);
    
    if (result.isError) {
      return this.jsonResponse({ 
        error: result.content[0].type === 'text' ? result.content[0].text : 'Failed to add prompt' 
      }, 400);
    }
    
    return this.jsonResponse({ 
      message: result.content[0].type === 'text' ? result.content[0].text : 'Prompt added successfully',
      promptName: body.name
    });
  }
  
  /**
   * 更新提示词
   */
  private async handleUpdatePrompt(body: any): Promise<Response> {
    if (!body || typeof body !== 'object') {
      return this.jsonResponse({ error: 'Invalid request body' }, 400);
    }
    
    if (!body.name || typeof body.name !== 'string') {
      return this.jsonResponse({ error: 'Prompt name is required' }, 400);
    }
    
    const result = await this.promptService.updatePrompt(body.name, body as Partial<Prompt>);
    
    if (result.isError) {
      return this.jsonResponse({ 
        error: result.content[0].type === 'text' ? result.content[0].text : 'Failed to update prompt' 
      }, 400);
    }
    
    return this.jsonResponse({ 
      message: result.content[0].type === 'text' ? result.content[0].text : 'Prompt updated successfully',
      promptName: body.name
    });
  }
  
  /**
   * 删除提示词
   */
  private async handleDeletePrompt(body: any): Promise<Response> {
    if (!body || typeof body !== 'object') {
      return this.jsonResponse({ error: 'Invalid request body' }, 400);
    }
    
    if (!body.name || typeof body.name !== 'string') {
      return this.jsonResponse({ error: 'Prompt name is required' }, 400);
    }
    
    const result = await this.promptService.deletePrompt(body.name);
    
    if (result.isError) {
      return this.jsonResponse({ 
        error: result.content[0].type === 'text' ? result.content[0].text : 'Failed to delete prompt' 
      }, 400);
    }
    
    return this.jsonResponse({ 
      message: result.content[0].type === 'text' ? result.content[0].text : 'Prompt deleted successfully',
      promptName: body.name
    });
  }
  
  /**
   * 处理提示词
   */
  private async handleProcessPrompt(promptName: string, args: ToolInputArgs): Promise<Response> {
    const result = await this.promptService.processPrompt(promptName, args);
    
    if (result.isError) {
      return this.jsonResponse({ 
        error: result.content[0].type === 'text' ? result.content[0].text : 'Failed to process prompt' 
      }, 400);
    }
    
    return this.jsonResponse({ 
      result: result.content[0].type === 'text' ? result.content[0].text : null,
      promptName
    });
  }
  
  /**
   * 创建 JSON 响应
   */
  private jsonResponse(data: any, status: number = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
