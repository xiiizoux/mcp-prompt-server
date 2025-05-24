/**
 * MCP Prompt Server 主入口文件
 * 支持标准输入/输出通信，用于传统部署环境
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z, ZodTypeAny } from 'zod';
import { PromptService } from './core/prompt-service.js';
import { createStorage } from './storage/factory.js';
import { Prompt, LoadedPrompt, ToolInputArgs, ToolOutput, RequestHandlerExtra } from './types.js';

// Zod 验证模式
const PromptArgumentSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  required: z.boolean().optional(),
});

const PromptMessageContentSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
});

const PromptMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.union([
    PromptMessageContentSchema,
    z.object({ text: z.string() })
  ]),
});

const AddNewPromptSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  arguments: z.array(PromptArgumentSchema).optional(),
  messages: z.array(PromptMessageSchema),
});

const UpdatePromptSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  arguments: z.array(PromptArgumentSchema).optional(),
  messages: z.array(PromptMessageSchema).optional(),
});

const DeletePromptSchema = z.object({
  name: z.string(),
});

// 全局变量
let server: McpServer;
let transport: StdioServerTransport;
let promptService: PromptService;

/**
 * 处理获取提示词名称请求
 */
export async function handleGetPromptNames(args: {}, extra: RequestHandlerExtra): Promise<ToolOutput> {
  const promptNames = promptService.getPromptNames();
  return {
    content: [{ type: "text", text: `可用的prompts (${promptNames.length}):\n${promptNames.join('\n')}` }]
  };
}

/**
 * 处理重新加载提示词请求
 */
export async function handleReloadPrompts(args: {}, extra: RequestHandlerExtra): Promise<ToolOutput> {
  await promptService.loadAllPrompts();
  return {
    content: [{ 
      type: "text", 
      text: `Server and all ${promptService.getLoadedPrompts().length} prompts reloaded successfully.` 
    }]
  };
}

/**
 * 处理添加新提示词请求
 */
export async function handleAddNewPrompt(args: { [x: string]: any }, extra: RequestHandlerExtra): Promise<ToolOutput> {
  const { name, description, arguments: promptArgs, messages } = args;
  
  // 创建提示词对象
  const newPrompt: LoadedPrompt = {
    name,
    description,
    arguments: promptArgs,
    messages
  };
  
  // 添加提示词
  return await promptService.addPrompt(newPrompt);
}

/**
 * 处理更新提示词请求
 */
export async function handleUpdatePrompt(args: { [x: string]: any }, extra: RequestHandlerExtra): Promise<ToolOutput> {
  const { name, description, arguments: promptArgs, messages } = args;
  
  // 创建更新对象
  const updatedPrompt: Partial<Prompt> = {};
  if (description !== undefined) updatedPrompt.description = description;
  if (promptArgs !== undefined) updatedPrompt.arguments = promptArgs;
  if (messages !== undefined) updatedPrompt.messages = messages;
  
  // 更新提示词
  return await promptService.updatePrompt(name, updatedPrompt);
}

/**
 * 处理删除提示词请求
 */
export async function handleDeletePrompt(args: { [x: string]: any }, extra: RequestHandlerExtra): Promise<ToolOutput> {
  const { name } = args;
  
  // 删除提示词
  return await promptService.deletePrompt(name);
}

/**
 * 注册提示词工具
 */
function registerPromptTools(currentServer: McpServer, prompts: LoadedPrompt[]): void {
  prompts.forEach((prompt: LoadedPrompt) => {
    const schemaObj: Record<string, ZodTypeAny> = {};
    if (prompt.arguments && Array.isArray(prompt.arguments)) {
      prompt.arguments.forEach((arg) => {
        schemaObj[arg.name] = z.string().describe(arg.description || `参数: ${arg.name}`);
      });
    }

    currentServer.tool(
      prompt.name,
      prompt.description || `Prompt: ${prompt.name}`,
      schemaObj,
      async (args: ToolInputArgs, extra: RequestHandlerExtra): Promise<ToolOutput> => {
        return await promptService.processPrompt(prompt.name, args);
      }
    );
  });
}

/**
 * 注册管理工具
 */
function registerManagementTools(currentServer: McpServer): void {
  // 空模式，用于无参数工具
  const emptySchema: Record<string, ZodTypeAny> = {};
  
  // 转换 Zod 模式为 Record<string, ZodTypeAny> 格式
  const addNewPromptSchema: Record<string, ZodTypeAny> = {
    name: z.string(),
    description: z.string().optional(),
    arguments: z.array(PromptArgumentSchema).optional(),
    messages: z.array(PromptMessageSchema)
  };
  
  const updatePromptSchema: Record<string, ZodTypeAny> = {
    name: z.string(),
    description: z.string().optional(),
    arguments: z.array(PromptArgumentSchema).optional(),
    messages: z.array(PromptMessageSchema).optional()
  };
  
  const deletePromptSchema: Record<string, ZodTypeAny> = {
    name: z.string()
  };

  // 注册管理工具
  currentServer.tool("reload_prompts", "Reloads all prompts from disk and reinitializes server tools.", emptySchema, handleReloadPrompts);
  currentServer.tool("add_new_prompt", "Adds a new prompt dynamically without manual file creation and server restart.", addNewPromptSchema, handleAddNewPrompt);
  currentServer.tool("update_prompt", "Updates an existing prompt file and reinitializes server tools.", updatePromptSchema, handleUpdatePrompt);
  currentServer.tool("delete_prompt", "Deletes an existing prompt file and reinitializes server tools.", deletePromptSchema, handleDeletePrompt);
  currentServer.tool(
    "get_prompt_names",
    "获取所有可用的prompt名称", emptySchema, handleGetPromptNames);
}

/**
 * 重新加载服务器和工具
 */
export async function reloadServerAndTools(): Promise<void> {
  console.log('Reloading server and tools...');
  
  // 加载提示词
  await promptService.loadAllPrompts();
  console.log(`Loaded ${promptService.getLoadedPrompts().length} prompts`);

  // 创建新的服务器实例
  server = new McpServer({
    name: "mcp-prompt-server",
    version: "1.0.0"
  });

  // 注册工具
  registerManagementTools(server);
  registerPromptTools(server, promptService.getLoadedPrompts());
  
  // 连接服务器
  if (transport) { 
    try {
      await server.connect(transport);
      console.log(`MCP Prompt Server is running with ${promptService.getLoadedPrompts().length} dynamic prompt(s) and management tools.`);
    } catch (error: any) {
      console.error('Error connecting server during reload:', error.message);
    }
  } else {
    console.warn('Transport not initialized. Server created but not connected.');
  }
}

/**
 * 启动服务器
 */
async function startServer(): Promise<void> {
  // 创建存储实例
  const storage = createStorage();
  
  // 创建提示词服务
  promptService = new PromptService(storage);
  
  // 初始化传输层
  transport = new StdioServerTransport();
  
  // 加载服务器和工具
  await reloadServerAndTools();
}

// 导出用于测试的函数和变量
export const getPromptService = () => promptService;

// 启动服务器
// 在 ES 模块中，直接启动服务器
startServer().catch((error: Error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
