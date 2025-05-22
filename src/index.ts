import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import { z, ZodTypeAny } from 'zod';

// Define interfaces and types
interface PromptArgument {
  name: string;
  description?: string;
}

interface PromptMessageContent {
  type: string; // Assuming 'text' is one of the types
  text?: string;
  // Potentially other fields depending on the content type
}

interface PromptMessage {
  role: 'user' | 'assistant' | 'system'; // Assuming these are the possible roles
  content: PromptMessageContent | { text: string }; // Handle simple text content too for now
}

interface Prompt {
  name?: string; // Name is optional initially, but validated later
  description?: string;
  arguments?: PromptArgument[];
  messages?: PromptMessage[];
}

interface LoadedPrompt extends Prompt {
  name: string; // Name is mandatory for a loaded prompt
}

interface ToolInputArgs {
  [key: string]: string;
}

// More detailed content types based on SDK error messages
interface TextContent {
  type: "text";
  text: string;
  [key: string]: unknown; 
}

interface ImageContent {
  type: "image";
  data: string;
  mimeType: string;
  [key: string]: unknown;
}

// Define the two shapes for the resource object as expected by the SDK
interface TextUriResourceShape {
  text: string;
  uri: string;
  mimeType?: string;
  [key: string]: unknown;
}

interface UriBlobResourceShape {
  uri: string;
  blob: string; // blob is required as string in this variant
  mimeType?: string;
  [key: string]: unknown;
}

interface ResourceContent {
  type: "resource";
  resource: TextUriResourceShape | UriBlobResourceShape; // resource is one of these two shapes
  [key: string]: unknown;
}

type ToolOutputContent = TextContent | ImageContent | ResourceContent; // This now includes the corrected ResourceContent

interface ToolOutput {
  content: ToolOutputContent[];
  _meta?: { [key: string]: any };
  isError?: boolean;
  [key: string]: unknown; 
}

// Placeholder for RequestHandlerExtra if needed by the SDK
type RequestHandlerExtra = any;

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 预设prompts的目录路径
const PROMPTS_DIR: string = path.join(__dirname, 'prompts');

// 存储所有加载的prompts
let loadedPrompts: LoadedPrompt[] = [];

/**
 * 从prompts目录加载所有预设的prompt
 */
async function loadPrompts(): Promise<LoadedPrompt[]> {
  try {
    // 确保prompts目录存在
    await fs.ensureDir(PROMPTS_DIR);
    
    // 读取prompts目录中的所有文件
    const files: string[] = await fs.readdir(PROMPTS_DIR);
    
    // 过滤出YAML和JSON文件
    const promptFiles: string[] = files.filter(file => 
      file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.json')
    );
    
    // 加载每个prompt文件
    const prompts: LoadedPrompt[] = [];
    for (const file of promptFiles) {
      const filePath: string = path.join(PROMPTS_DIR, file);
      const content: string = await fs.readFile(filePath, 'utf8');
      
      let prompt: Prompt;
      if (file.endsWith('.json')) {
        prompt = JSON.parse(content) as Prompt;
      } else {
        // 假设其他文件是YAML格式
        prompt = YAML.parse(content) as Prompt;
      }
      
      // 确保prompt有name字段
      if (!prompt.name) {
        console.warn(`Warning: Prompt in ${file} is missing a name field. Skipping.`);
        continue;
      }
      
      prompts.push(prompt as LoadedPrompt); // Cast to LoadedPrompt after name check
    }
    
    loadedPrompts = prompts;
    console.log(`Loaded ${prompts.length} prompts from ${PROMPTS_DIR}`);
    return prompts;
  } catch (error: any) {
    console.error('Error loading prompts:', error.message);
    return [];
  }
}

/**
 * 启动MCP服务器
 */
async function startServer(): Promise<void> {
  // 加载所有预设的prompts
  await loadPrompts();
  
  // 创建MCP服务器
  const server = new McpServer({
    name: "mcp-prompt-server",
    version: "1.0.0"
  });
  
  // 为每个预设的prompt创建一个工具
  loadedPrompts.forEach((prompt: LoadedPrompt) => {
    // 构建工具的输入schema
    const schemaObj: Record<string, ZodTypeAny> = {};
    
    if (prompt.arguments && Array.isArray(prompt.arguments)) {
      prompt.arguments.forEach((arg: PromptArgument) => {
        // 默认所有参数都是字符串类型
        schemaObj[arg.name] = z.string().describe(arg.description || `参数: ${arg.name}`);
      });
    }
    
    // 注册工具
    server.tool(
      prompt.name,
      prompt.description || `Prompt: ${prompt.name}`, // Description string
      schemaObj, // Pass the raw ZodRawShape object
      async (args: ToolInputArgs, extra: RequestHandlerExtra): Promise<ToolOutput> => { // Handler function, added 'extra'
        // 处理prompt内容
        let promptText: string = '';
        
        if (prompt.messages && Array.isArray(prompt.messages)) {
          // 只处理用户消息
          const userMessages: PromptMessage[] = prompt.messages.filter(
            (msg: PromptMessage) => msg.role === 'user'
          );
          
          for (const message of userMessages) {
            // Ensure content is of type { text: string } or PromptMessageContent with text
            let textContent: string | undefined;
            if ('text' in message.content) {
              textContent = (message.content as { text: string }).text;
            } else if (message.content.type === 'text' && typeof message.content.text === 'string') {
              textContent = message.content.text;
            }

            if (textContent) {
              let text: string = textContent;
              // 替换所有 {{arg}} 格式的参数
              for (const [key, value] of Object.entries(args)) {
                text = text.replace(new RegExp(`{{${key}}}`, 'g'), String(value)); // Ensure value is string
              }
              promptText += text + '\n\n';
            }
          }
        }
        
        // 返回处理后的prompt内容
        return {
          content: [
            {
              type: "text",
              text: promptText.trim()
            }
          ]
        };
      }
    );
  });
  
  // 添加管理工具 - 重新加载prompts
  server.tool(
    "reload_prompts",
    "重新加载所有预设的prompts", // Description string
    {}, // Empty ZodRawShape for no arguments
    async (args: {}, extra: RequestHandlerExtra): Promise<ToolOutput> => { // Handler function, added 'args', 'extra'
      await loadPrompts();
      return {
        content: [
          {
            type: "text",
            text: `成功重新加载了 ${loadedPrompts.length} 个prompts。`
          }
        ]
      };
    }
  );
  
  // 添加管理工具 - 获取prompt名称列表
  server.tool(
    "get_prompt_names",
    "获取所有可用的prompt名称", // Description string
    {}, // Empty ZodRawShape for no arguments
    async (args: {}, extra: RequestHandlerExtra): Promise<ToolOutput> => { // Handler function, added 'args', 'extra'
      const promptNames: string[] = loadedPrompts.map((p: LoadedPrompt) => p.name);
      return {
        content: [
          {
            type: "text",
            text: `可用的prompts (${promptNames.length}):\n${promptNames.join('\n')}`
          }
        ]
      };
    }
  );
  
  // 创建stdio传输层
  const transport = new StdioServerTransport();
  
  // 连接服务器
  await server.connect(transport);
  console.log('MCP Prompt Server is running...');
}

// 启动服务器
startServer().catch((error: Error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
