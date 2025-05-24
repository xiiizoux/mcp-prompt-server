/**
 * MCP Prompt Server 主入口文件
 * 支持标准输入/输出通信，用于传统部署环境
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z, ZodTypeAny } from 'zod';
import { PromptService } from './core/prompt-service.js';
import { createStorage } from './storage/factory.js';
import { Prompt, LoadedPrompt, ToolInputArgs, ToolOutput, RequestHandlerExtra, PromptCategory, PromptTag } from './types.js';

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

// 定义类别枚举验证
const PromptCategorySchema = z.enum([
  PromptCategory.WRITING,
  PromptCategory.CODING,
  PromptCategory.ANALYSIS,
  PromptCategory.CONVERSATION,
  PromptCategory.CREATIVITY,
  PromptCategory.OTHER
]);

const AddNewPromptSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  arguments: z.array(PromptArgumentSchema).optional(),
  messages: z.array(PromptMessageSchema),
  tags: z.array(z.string()).optional(),
  category: PromptCategorySchema.optional()
});

const UpdatePromptSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  arguments: z.array(PromptArgumentSchema).optional(),
  messages: z.array(PromptMessageSchema).optional(),
  tags: z.array(z.string()).optional(),
  category: PromptCategorySchema.optional()
});

const DeletePromptSchema = z.object({
  name: z.string(),
});

// 搜索提示词验证模式
const SearchPromptsSchema = z.object({
  keyword: z.string().optional(),
  category: PromptCategorySchema.optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().optional().default(1),
  pageSize: z.number().optional().default(10)
});

// 获取提示词详情验证模式
const GetPromptDetailsSchema = z.object({
  name: z.string()
});

// 获取提示词名称带过滤验证模式
const GetPromptNamesFilteredSchema = z.object({
  category: PromptCategorySchema.optional(),
  tags: z.array(z.string()).optional()
});

// 获取标签云和类别统计验证模式 - 使用空对象作为 Record<string, ZodTypeAny>
const GetAllTagsSchema: Record<string, ZodTypeAny> = {};
const GetAllCategoriesSchema: Record<string, ZodTypeAny> = {};

// 导出提示词验证模式
const ExportPromptsSchema = z.object({
  names: z.array(z.string()).optional(),
  category: PromptCategorySchema.optional(),
  tags: z.array(z.string()).optional()
});

// 导入提示词验证模式
const ImportPromptsSchema = z.object({
  prompts: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      category: PromptCategorySchema.optional(),
      tags: z.array(z.string()).optional(),
      arguments: z.array(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          required: z.boolean().optional()
        })
      ).optional(),
      messages: z.array(
        z.object({
          role: z.enum(["system", "user", "assistant"]),
          content: z.object({
            type: z.string(),
            text: z.string()
          })
        })
      )
    })
  ),
  overwrite: z.boolean().optional().default(false)
});

// 批量更新提示词验证模式
const BatchUpdatePromptsSchema = z.object({
  names: z.array(z.string()),
  updates: z.object({
    description: z.string().optional(),
    category: PromptCategorySchema.optional(),
    tags: z.array(z.string()).optional()
  })
});

// 全局变量
let server: McpServer;
let transport: StdioServerTransport;
let promptService: PromptService;

/**
 * 处理获取提示词名称请求
 * 支持按类别和标签过滤
 */
export async function handleGetPromptNames(args: { category?: PromptCategory, tags?: PromptTag[] }, extra: RequestHandlerExtra): Promise<ToolOutput> {
  const { category, tags } = args;
  const promptNames = promptService.getPromptNames(category, tags);
  
  let resultText = `可用的prompts (${promptNames.length}):`;
  
  // 添加过滤条件信息
  if (category) {
    resultText += `\n类别过滤: ${category}`;
  }
  
  if (tags && tags.length > 0) {
    resultText += `\n标签过滤: ${tags.join(', ')}`;
  }
  
  // 添加提示词名称列表
  resultText += `\n${promptNames.join('\n')}`;
  
  return {
    content: [{ type: "text", text: resultText }]
  };
}

/**
 * 处理搜索提示词请求
 */
export async function handleSearchPrompts(args: { keyword?: string, category?: PromptCategory, tags?: PromptTag[], page?: number, pageSize?: number }, extra: RequestHandlerExtra): Promise<ToolOutput> {
  const { keyword, category, tags, page = 1, pageSize = 10 } = args;
  
  // 搜索提示词，支持分页
  const searchResults = await promptService.searchPrompts(keyword || "", category, tags, page, pageSize);
  
  if (searchResults.total === 0) {
    return {
      content: [{ type: "text", text: "没有找到符合条件的提示词" }]
    };
  }
  
  // 构建分页信息
  let resultText = `搜索结果 (共 ${searchResults.total} 个提示词):\n`;
  resultText += `当前页: ${searchResults.page}/${searchResults.totalPages}, 每页 ${searchResults.pageSize} 条\n\n`;
  
  // 添加提示词信息
  searchResults.prompts.forEach((prompt, index) => {
    const displayIndex = (searchResults.page - 1) * searchResults.pageSize + index + 1;
    resultText += `${displayIndex}. ${prompt.name}`;
    if (prompt.description) {
      resultText += `: ${prompt.description}`;
    }
    if (prompt.category) {
      resultText += ` [类别: ${prompt.category}]`;
    }
    if (prompt.tags && prompt.tags.length > 0) {
      resultText += ` [标签: ${prompt.tags.join(', ')}]`;
    }
    resultText += '\n';
  });
  
  // 添加分页导航提示
  if (searchResults.totalPages > 1) {
    resultText += `\n分页导航: `;
    if (searchResults.page > 1) {
      resultText += `使用 page=${searchResults.page - 1} 查看上一页 | `;
    }
    if (searchResults.page < searchResults.totalPages) {
      resultText += `使用 page=${searchResults.page + 1} 查看下一页`;
    }
  }
  
  return {
    content: [{ type: "text", text: resultText }]
  };
}

/**
 * 处理获取所有标签请求
 */
export async function handleGetAllTags(args: { [x: string]: any }, extra: RequestHandlerExtra): Promise<ToolOutput> {
  const tagCounts = promptService.getAllTags();
  const tags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]); // 按使用频率降序排序
  
  if (tags.length === 0) {
    return {
      content: [{ type: "text", text: "当前没有可用的标签" }]
    };
  }
  
  let resultText = `标签云 (共 ${tags.length} 个标签):\n`;
  
  tags.forEach(([tag, count]) => {
    resultText += `${tag}: ${count} 次\n`;
  });
  
  return {
    content: [{ type: "text", text: resultText }]
  };
}

/**
 * 处理导出提示词请求
 */
export async function handleExportPrompts(args: { [x: string]: any }, extra: RequestHandlerExtra): Promise<ToolOutput> {
  const { names, category, tags } = args;
  const exportedPrompts = promptService.exportPrompts(names, category, tags);
  
  if (exportedPrompts.length === 0) {
    return {
      content: [{ type: "text", text: "没有找到符合条件的提示词" }],
      isError: true
    };
  }
  
  // 转换为 JSON 格式返回
  return {
    content: [{ type: "text", text: JSON.stringify(exportedPrompts, null, 2) }]
  };
}

/**
 * 处理导入提示词请求
 */
export async function handleImportPrompts(args: { [x: string]: any }, extra: RequestHandlerExtra): Promise<ToolOutput> {
  const { prompts, overwrite } = args;
  
  if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
    return {
      content: [{ type: "text", text: "没有提供要导入的提示词" }],
      isError: true
    };
  }
  
  return await promptService.importPrompts(prompts, overwrite);
}

/**
 * 处理批量更新提示词请求
 */
export async function handleBatchUpdatePrompts(args: { [x: string]: any }, extra: RequestHandlerExtra): Promise<ToolOutput> {
  const { names, updates } = args;
  
  if (!names || !Array.isArray(names) || names.length === 0) {
    return {
      content: [{ type: "text", text: "没有指定要更新的提示词" }],
      isError: true
    };
  }
  
  if (!updates || Object.keys(updates).length === 0) {
    return {
      content: [{ type: "text", text: "没有指定要更新的内容" }],
      isError: true
    };
  }
  
  return await promptService.batchUpdatePrompts(names, updates);
}

/**
 * 处理获取所有类别请求
 */
export async function handleGetAllCategories(args: { [x: string]: any }, extra: RequestHandlerExtra): Promise<ToolOutput> {
  const categoryCounts = promptService.getAllCategories();
  const categories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]); // 按使用频率降序排序
  
  if (categories.length === 0) {
    return {
      content: [{ type: "text", text: "当前没有可用的类别" }]
    };
  }
  
  let resultText = `类别统计 (共 ${categories.length} 个类别):\n`;
  
  categories.forEach(([category, count]) => {
    resultText += `${category}: ${count} 次\n`;
  });
  
  return {
    content: [{ type: "text", text: resultText }]
  };
}

/**
 * 处理获取提示词详情请求
 */
export async function handleGetPromptDetails(args: { [x: string]: any }, extra: RequestHandlerExtra): Promise<ToolOutput> {
  const { name } = args;
  const promptDetails = promptService.getPromptDetails(name);
  
  if (!promptDetails) {
    return {
      content: [{ type: "text", text: `提示词 '${name}' 不存在` }],
      isError: true
    };
  }
  
  // 构建提示词详情文本
  let detailsText = `提示词详情: ${promptDetails.name}\n`;
  
  if (promptDetails.description) {
    detailsText += `\n描述: ${promptDetails.description}`;
  }
  
  if (promptDetails.category) {
    detailsText += `\n类别: ${promptDetails.category}`;
  }
  
  if (promptDetails.tags && promptDetails.tags.length > 0) {
    detailsText += `\n标签: ${promptDetails.tags.join(', ')}`;
  }
  
  if (promptDetails.createdAt) {
    detailsText += `\n创建时间: ${promptDetails.createdAt}`;
  }
  
  if (promptDetails.updatedAt) {
    detailsText += `\n更新时间: ${promptDetails.updatedAt}`;
  }
  
  // 添加参数信息
  if (promptDetails.arguments && promptDetails.arguments.length > 0) {
    detailsText += `\n\n参数:`;
    promptDetails.arguments.forEach((arg, index) => {
      detailsText += `\n${index + 1}. ${arg.name}`;
      if (arg.description) {
        detailsText += ` - ${arg.description}`;
      }
      if (arg.required) {
        detailsText += ` (必填)`;
      }
    });
  }
  
  // 添加消息信息
  if (promptDetails.messages && promptDetails.messages.length > 0) {
    detailsText += `\n\n消息模板:`;
    promptDetails.messages.forEach((msg, index) => {
      detailsText += `\n${index + 1}. 角色: ${msg.role}`;
      let messageText = '';
      if ('text' in msg.content) {
        messageText = (msg.content as { text: string }).text;
      } else if (msg.content.type === 'text' && typeof msg.content.text === 'string') {
        messageText = msg.content.text;
      }
      if (messageText) {
        // 将消息内容缩进显示
        const indentedText = messageText.split('\n').map(line => `   ${line}`).join('\n');
        detailsText += `\n   内容: \n${indentedText}`;
      }
    });
  }
  
  return {
    content: [{ type: "text", text: detailsText }]
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
  const { name, description, arguments: promptArgs, messages, tags, category } = args;
  
  // 创建提示词对象
  const newPrompt: LoadedPrompt = {
    name,
    description,
    arguments: promptArgs,
    messages,
    tags,
    category
  };
  
  // 添加提示词
  return await promptService.addPrompt(newPrompt);
}

/**
 * 处理更新提示词请求
 */
export async function handleUpdatePrompt(args: { [x: string]: any }, extra: RequestHandlerExtra): Promise<ToolOutput> {
  const { name, description, arguments: promptArgs, messages, tags, category } = args;
  
  // 创建更新对象
  const updatedPrompt: Partial<Prompt> = {};
  if (description !== undefined) updatedPrompt.description = description;
  if (promptArgs !== undefined) updatedPrompt.arguments = promptArgs;
  if (messages !== undefined) updatedPrompt.messages = messages;
  if (tags !== undefined) updatedPrompt.tags = tags;
  if (category !== undefined) updatedPrompt.category = category;
  
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
 * @param currentServer 当前服务器
 * @param promptServiceInstance 提示词服务实例
 */
export function registerManagementTools(currentServer: McpServer, promptServiceInstance?: PromptService): void {
  // 空模式，用于无参数工具
  const emptySchema: Record<string, ZodTypeAny> = {};
  
  // 转换 Zod 模式为 Record<string, ZodTypeAny> 格式
  const addNewPromptSchema: Record<string, ZodTypeAny> = {
    name: z.string(),
    description: z.string().optional(),
    arguments: z.array(PromptArgumentSchema).optional(),
    messages: z.array(PromptMessageSchema),
    tags: z.array(z.string()).optional(),
    category: PromptCategorySchema.optional()
  };
  
  const updatePromptSchema: Record<string, ZodTypeAny> = {
    name: z.string(),
    description: z.string().optional(),
    arguments: z.array(PromptArgumentSchema).optional(),
    messages: z.array(PromptMessageSchema).optional(),
    tags: z.array(z.string()).optional(),
    category: PromptCategorySchema.optional()
  };
  
  const deletePromptSchema: Record<string, ZodTypeAny> = {
    name: z.string()
  };
  
  const searchPromptsSchema: Record<string, ZodTypeAny> = {
    keyword: z.string().optional(),
    category: PromptCategorySchema.optional(),
    tags: z.array(z.string()).optional()
  };
  
  const getPromptDetailsSchema: Record<string, ZodTypeAny> = {
    name: z.string()
  };
  
  const getPromptNamesFilteredSchema: Record<string, ZodTypeAny> = {
    category: PromptCategorySchema.optional(),
    tags: z.array(z.string()).optional()
  };

  // 注册管理工具
  currentServer.tool("reload_prompts", "Reloads all prompts from disk and reinitializes server tools.", emptySchema, handleReloadPrompts);
  currentServer.tool("add_new_prompt", "Adds a new prompt dynamically without manual file creation and server restart.", addNewPromptSchema, handleAddNewPrompt);
  currentServer.tool("update_prompt", "Updates an existing prompt file and reinitializes server tools.", updatePromptSchema, handleUpdatePrompt);
  currentServer.tool("delete_prompt", "Deletes an existing prompt file and reinitializes server tools.", deletePromptSchema, handleDeletePrompt);
  
  // 注册提示词查询工具
  currentServer.tool(
    "get_prompt_names",
    "获取所有可用的prompt名称，支持按类别和标签过滤", 
    getPromptNamesFilteredSchema, 
    handleGetPromptNames);
  
  currentServer.tool(
    "search_prompts",
    "根据关键词、类别和标签搜索提示词",
    searchPromptsSchema,
    handleSearchPrompts);
    
  currentServer.tool(
    "get_prompt_details",
    "获取提示词的详细信息，包括参数、消息模板等",
    getPromptDetailsSchema,
    handleGetPromptDetails);
    
  // 注册标签和类别统计工具
  currentServer.tool(
    "get_all_tags",
    "获取所有标签及其使用频率，可用于构建标签云",
    GetAllTagsSchema,
    handleGetAllTags);
    
  currentServer.tool(
    "get_all_categories",
    "获取所有类别及其使用频率",
    GetAllCategoriesSchema,
    handleGetAllCategories);
    
  // 注册批量操作工具
  currentServer.tool(
    "export_prompts",
    "导出提示词，可按名称、类别或标签过滤",
    ExportPromptsSchema.shape,
    handleExportPrompts);
    
  currentServer.tool(
    "import_prompts",
    "批量导入提示词，可选择是否覆盖现有提示词",
    ImportPromptsSchema.shape,
    handleImportPrompts);
    
  currentServer.tool(
    "batch_update_prompts",
    "批量更新提示词属性，如类别、标签等",
    BatchUpdatePromptsSchema.shape,
    handleBatchUpdatePrompts);
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
  registerManagementTools(server, promptService);
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
