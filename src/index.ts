import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import { z, ZodTypeAny } from 'zod';

// Define interfaces and types
// Zod Schemas for Tools
const PromptArgumentSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

const PromptMessageContentSchema = z.object({
  type: z.string(), // Assuming 'text' is one of the types
  text: z.string().optional(),
  // Potentially other fields depending on the content type
});

const PromptMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.union([
    PromptMessageContentSchema,
    z.object({ text: z.string() }) // Handle simple text content
  ]),
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

// Module-scoped server and transport instances
let server: McpServer;
let transport: StdioServerTransport;

// 存储所有加载的prompts - This will be updated by reloadServerAndTools
let loadedPrompts: LoadedPrompt[] = [];

/**
 * Finds a prompt file by its name, checking for .yaml, .yml, and .json extensions.
 * @param promptName The name of the prompt to find.
 * @returns The full path to the prompt file if found, otherwise null.
 */
async function findPromptFile(promptName: string): Promise<string | null> {
  const extensions = ['.yaml', '.yml', '.json'];
  for (const ext of extensions) {
    const filePath = path.join(PROMPTS_DIR, promptName + ext);
    if (await fs.pathExists(filePath)) {
      return filePath;
    }
  }
  return null;
}

/**
 * Loads all preset prompts from the prompts directory.
 * This function now only reads from disk and returns the prompts.
 */
async function loadPromptsFromFiles(): Promise<LoadedPrompt[]> {
  try {
    await fs.ensureDir(PROMPTS_DIR);
    const files = await fs.readdir(PROMPTS_DIR);
    const promptFiles = files.filter(file =>
      file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.json')
    );

    const prompts: LoadedPrompt[] = [];
    for (const file of promptFiles) {
      const filePath = path.join(PROMPTS_DIR, file);
      const content = await fs.readFile(filePath, 'utf8');
      let prompt: Prompt;

      if (file.endsWith('.json')) {
        prompt = JSON.parse(content) as Prompt;
      } else {
        prompt = YAML.parse(content) as Prompt;
      }

      if (!prompt.name) {
        // Log to server console, not client
        console.warn(`Warning: Prompt in ${file} is missing a name field. Skipping.`);
        continue;
      }
      prompts.push(prompt as LoadedPrompt);
    }
    // console.log(`Successfully loaded ${prompts.length} prompts from files.`); // Logging moved to reloadServerAndTools
    return prompts;
  } catch (error: any) {
    console.error('Error loading prompts from files:', error.message);
    return []; // Return empty array on error
  }
}

/**
 * Registers tools for each loaded prompt on the given server instance.
 */
function registerPromptTools(currentServer: McpServer, promptsToRegister: LoadedPrompt[]): void {
  promptsToRegister.forEach((prompt: LoadedPrompt) => {
    const schemaObj: Record<string, ZodTypeAny> = {};
    if (prompt.arguments && Array.isArray(prompt.arguments)) {
      prompt.arguments.forEach((arg: PromptArgument) => {
        schemaObj[arg.name] = z.string().describe(arg.description || `参数: ${arg.name}`);
      });
    }

    currentServer.tool(
      prompt.name,
      prompt.description || `Prompt: ${prompt.name}`,
      schemaObj,
      async (args: ToolInputArgs, extra: RequestHandlerExtra): Promise<ToolOutput> => {
        let promptText = '';
        if (prompt.messages && Array.isArray(prompt.messages)) {
          const userMessages = prompt.messages.filter(msg => msg.role === 'user');
          for (const message of userMessages) {
            let textContent: string | undefined;
            if ('text' in message.content) {
              textContent = (message.content as { text: string }).text;
            } else if (message.content.type === 'text' && typeof message.content.text === 'string') {
              textContent = message.content.text;
            }

            if (textContent) {
              let text = textContent;
              for (const [key, value] of Object.entries(args)) {
                text = text.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
              }
              promptText += text + '\n\n';
            }
          }
        }
        return { content: [{ type: "text", text: promptText.trim() }] };
      }
    );
  });
}

// Exported for testing purposes
export async function handleReloadPrompts(args: {}, extra: RequestHandlerExtra): Promise<ToolOutput> {
  await reloadServerAndTools();
  return {
    content: [{ type: "text", text: `Server and all ${loadedPrompts.length} prompts reloaded successfully.` }]
  };
}

export async function handleUpdatePrompt(inputArgs: z.infer<typeof UpdatePromptSchema>, extra: RequestHandlerExtra): Promise<ToolOutput> {
  const { name, description, arguments: args, messages } = inputArgs;
  const filePath = await findPromptFile(name);

  if (!filePath) {
    return { content: [{ type: "text", text: `Prompt '${name}' not found.` }], isError: true };
  }
  const fileType = filePath.endsWith('.json') ? 'json' : 'yaml';

  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    let promptData: Prompt = fileType === 'json' ? JSON.parse(fileContent) : YAML.parse(fileContent);
    
    const updatedPromptData: Prompt = { ...promptData, name: promptData.name || name };
    if (description !== undefined) updatedPromptData.description = description;
    if (args !== undefined) updatedPromptData.arguments = args;
    if (messages !== undefined) updatedPromptData.messages = messages;

    const outputContent = fileType === 'json' ? JSON.stringify(updatedPromptData, null, 2) : YAML.stringify(updatedPromptData);
    await fs.writeFile(filePath, outputContent, 'utf8');
    
    await reloadServerAndTools(); // Re-initialize server
    return { content: [{ type: "text", text: `Prompt '${name}' updated and server reloaded. Total prompts: ${loadedPrompts.length}.` }] };
  } catch (error: any) {
    console.error(`Error updating prompt '${name}':`, error);
    return { content: [{ type: "text", text: `Error updating prompt '${name}': ${error.message}` }], isError: true };
  }
}

export async function handleDeletePrompt(inputArgs: z.infer<typeof DeletePromptSchema>, extra: RequestHandlerExtra): Promise<ToolOutput> {
  const { name } = inputArgs;
  const filePath = await findPromptFile(name);

  if (!filePath) {
    return { content: [{ type: "text", text: `Prompt '${name}' not found.` }], isError: true };
  }

  try {
    await fs.remove(filePath);
    await reloadServerAndTools(); // Re-initialize server
    return { content: [{ type: "text", text: `Prompt '${name}' deleted and server reloaded. Total prompts: ${loadedPrompts.length}.` }] };
  } catch (error: any) {
    console.error(`Error deleting prompt '${name}':`, error);
    return { content: [{ type: "text", text: `Error deleting prompt '${name}': ${error.message}` }], isError: true };
  }
}

export async function handleGetPromptNames(args: {}, extra: RequestHandlerExtra): Promise<ToolOutput> {
  const promptNames = loadedPrompts.map(p => p.name);
  return {
    content: [{ type: "text", text: `可用的prompts (${promptNames.length}):\n${promptNames.join('\n')}` }]
  };
}


/**
 * Registers management tools on the given server instance.
 * Handlers for tools that modify prompts will call reloadServerAndTools.
 */
function registerManagementTools(currentServer: McpServer): void {
  currentServer.tool("reload_prompts", "Reloads all prompts from disk and reinitializes server tools.", {}, handleReloadPrompts);
  currentServer.tool("update_prompt", "Updates an existing prompt file and reinitializes server tools.", UpdatePromptSchema, handleUpdatePrompt);
  currentServer.tool("delete_prompt", "Deletes an existing prompt file and reinitializes server tools.", DeletePromptSchema, handleDeletePrompt);
  currentServer.tool(
    "get_prompt_names",
    "获取所有可用的prompt名称", {}, handleGetPromptNames);
}

/**
 * Initializes/Re-initializes the MCP server, loads prompts, registers all tools, and connects.
 */
// Exported for testing
export async function reloadServerAndTools(): Promise<void> {
  console.log('Reloading server and tools...');
  
  // Load prompts from files
  loadedPrompts = await loadPromptsFromFiles(); // Update global/module-scoped loadedPrompts
  console.log(`Loaded ${loadedPrompts.length} prompts from ${PROMPTS_DIR}`);

  // Create a new server instance (or reconfigure if possible, but re-creation is safer)
  // For testing, we might not want to fully recreate the server if it causes issues with transport,
  // but the current design re-creates it.
  server = new McpServer({
    name: "mcp-prompt-server",
    version: "1.0.0"
  });

  // Register all tools on the new server instance
  registerManagementTools(server);
  registerPromptTools(server, loadedPrompts);
  
  // Connect the server to the transport
  // Assuming transport can be reused. If not, it should be re-initialized here or in startServer.
  // In a test environment, transport might be null if startServer isn't fully run.
  if (transport) { 
    try {
      await server.connect(transport);
      console.log(`MCP Prompt Server is running with ${loadedPrompts.length} dynamic prompt(s) and management tools.`);
    } catch (error: any) {
      console.error('Error connecting server during reload:', error.message);
    }
  } else {
    // This case might occur if reloadServerAndTools is called directly in a test
    // without startServer having initialized the transport.
    console.warn('Transport not initialized. Server created but not connected. This is expected if running tests without full server start.');
  }
}

// Exported for testing
export const getLoadedPrompts = () => loadedPrompts;
export { PROMPTS_DIR, UpdatePromptSchema, DeletePromptSchema };


/**
 * Starts the MCP server for the first time.
 */
async function startServer(): Promise<void> {
  // Initialize transport once
  transport = new StdioServerTransport();
  
  // Perform initial server setup and tool registration
  await reloadServerAndTools();
}

// Start the server
startServer().catch((error: Error) => {
  console.error('Failed to start server initially:', error.message);
  process.exit(1);
});
