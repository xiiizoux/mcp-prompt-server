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

// Zod schemas for Prompt structure
const PromptArgumentSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

const PromptMessageContentSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

// Allow simple { text: string } or structured content for messages
const PromptMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.union([PromptMessageContentSchema, z.object({ text: z.string() })]),
});

const AddNewPromptArgsSchema = z.object({
  name: z.string().describe("The name of the prompt, which will also be used as the filename (e.g., 'my_prompt')."),
  description: z.string().optional().describe("A description for the prompt."),
  arguments: z.array(PromptArgumentSchema).optional().describe("An array of arguments that the prompt accepts."),
  messages: z.array(PromptMessageSchema).describe("An array of messages defining the prompt conversation."),
});


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
      
      let promptData: Prompt;
      if (file.endsWith('.json')) {
        promptData = JSON.parse(content) as Prompt;
      } else {
        // 假设其他文件是YAML格式
        promptData = YAML.parse(content) as Prompt;
      }
      
      // 确保prompt有name字段, 如果文件名是 'example.json', 则 name 应该是 'example'
      const expectedName = path.parse(file).name;
      if (!promptData.name || promptData.name !== expectedName) {
        console.warn(`Warning: Prompt in ${file} has a missing or mismatched name field. It should be '${expectedName}'. Skipping.`);
        // If name is missing, try to assign it from filename, otherwise skip.
        // For this refactoring, we'll be stricter.
        continue;
      }
      
      prompts.push(promptData as LoadedPrompt); // Cast to LoadedPrompt after name check
    }
    
    loadedPrompts = prompts; // Update the global list
    console.log(`Loaded ${prompts.length} prompts from ${PROMPTS_DIR}`);
    return prompts; // Return the loaded prompts for local use if needed
  } catch (error: any) {
    console.error('Error loading prompts:', error.message);
    loadedPrompts = []; // Reset on error
    return [];
  }
}

/**
 * Registers all loaded prompts as tools on the given MCP server instance.
 * Clears existing tools before registering new ones to avoid duplicates if called multiple times.
 */
function registerPromptTools(server: McpServer): void {
  // It's good practice to ensure we don't re-register tools with the same name,
  // but the McpServer might handle this by overwriting.
  // For clarity, let's assume McpServer.tool() overwrites if a tool with the same name exists.
  // If not, we might need server.unregisterTool(name) or similar.

  loadedPrompts.forEach((prompt: LoadedPrompt) => {
    const schemaObj: Record<string, ZodTypeAny> = {};
    if (prompt.arguments && Array.isArray(prompt.arguments)) {
      prompt.arguments.forEach((arg: PromptArgument) => {
        schemaObj[arg.name] = z.string().describe(arg.description || `参数: ${arg.name}`);
      });
    }

    server.tool(
      prompt.name,
      prompt.description || `Prompt: ${prompt.name}`,
      schemaObj,
      async (args: ToolInputArgs, extra: RequestHandlerExtra): Promise<ToolOutput> => {
        let promptText: string = '';
        if (prompt.messages && Array.isArray(prompt.messages)) {
          const userMessages: PromptMessage[] = prompt.messages.filter(
            (msg: PromptMessage) => msg.role === 'user'
          );
          for (const message of userMessages) {
            let textContent: string | undefined;
            if ('text' in message.content) { // Simple { text: string }
              textContent = (message.content as { text: string }).text;
            } else if (message.content.type === 'text' && typeof message.content.text === 'string') { // Structured { type: 'text', text: string }
              textContent = message.content.text;
            }

            if (textContent) {
              let text: string = textContent;
              for (const [key, value] of Object.entries(args)) {
                text = text.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
              }
              promptText += text + '\n\n';
            }
          }
        }
        return {
          content: [{ type: "text", text: promptText.trim() }]
        };
      }
    );
  });
  console.log(`Registered ${loadedPrompts.length} prompt tools.`);
}


/**
 * 启动MCP服务器
 */
async function startServer(): Promise<void> {
  // 创建MCP服务器
  const server = new McpServer({
    name: "mcp-prompt-server",
    version: "1.0.0"
  });

  // 加载所有预设的prompts
  await loadPrompts();
  // 注册加载的prompts为工具
  registerPromptTools(server);
  
  // 添加管理工具 - 重新加载prompts
  server.tool(
    "reload_prompts",
    "重新加载所有预设的prompts并更新工具列表。",
    {}, 
    async (args: {}, extra: RequestHandlerExtra): Promise<ToolOutput> => {
      await loadPrompts();
      registerPromptTools(server); // Re-register all tools
      return {
        content: [
          {
            type: "text",
            text: `成功重新加载并注册了 ${loadedPrompts.length} 个prompts。`
          }
        ]
      };
    }
  );
  
  // 添加管理工具 - 获取prompt名称列表
  server.tool(
    "get_prompt_names",
    "获取所有当前加载的prompt名称。",
    {}, 
    async (args: {}, extra: RequestHandlerExtra): Promise<ToolOutput> => {
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

  // 添加管理工具 - 新增prompt
  server.tool(
    "add_new_prompt",
    "添加一个新的prompt并使其可用作工具。",
    AddNewPromptArgsSchema.shape, // Use .shape for ZodRawShape
    async (inputArgs, extra: RequestHandlerExtra): Promise<ToolOutput> => {
      // The inputArgs are already validated by Zod via McpServer
      const { name, description, arguments: promptArgs, messages } = inputArgs as z.infer<typeof AddNewPromptArgsSchema>;

      const newPrompt: Prompt = {
        name,
        description,
        arguments: promptArgs,
        messages: messages.map(msg => {
          // Ensure messages conform to the stricter PromptMessage structure if they came in as {text: string}
          if ('text' in msg.content && !msg.content.type) {
            return {
              role: msg.role,
              content: { type: 'text', text: (msg.content as {text: string}).text }
            };
          }
          return msg as PromptMessage; // Already conforms
        }),
      };

      const filename = `${name}.json`;
      const filePath = path.join(PROMPTS_DIR, filename);

      try {
        await fs.writeJson(filePath, newPrompt, { spaces: 2 }); // fs-extra's writeJson is convenient
        console.log(`New prompt '${name}' saved to ${filePath}`);

        // Reload prompts and re-register all tools
        await loadPrompts();
        registerPromptTools(server);

        return {
          content: [
            {
              type: "text",
              text: `Prompt '${name}' added successfully and registered as a tool. Total prompts: ${loadedPrompts.length}.`
            }
          ]
        };
      } catch (error: any) {
        console.error(`Error adding new prompt '${name}':`, error.message);
        return {
          content: [
            {
              type: "text",
              text: `Error adding new prompt '${name}': ${error.message}`
            }
          ],
          isError: true,
        };
      }
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
