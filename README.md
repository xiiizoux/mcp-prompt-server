# MCP Prompt Server

## Overview

The MCP Prompt Server is a Node.js application that leverages the Model Context Protocol (MCP) to expose a collection of Large Language Model (LLM) prompts as callable tools. It allows for dynamic loading of prompts from local files and provides tools for managing and interacting with these prompts. This server is designed to guide AI models like Claude in performing specific tasks by providing them with structured prompts.

## Features

* **Dynamic Prompt Loading:** Loads prompt definitions from YAML files located in the `src/prompts` directory.
* **MCP Tool Exposure:** Each loaded prompt is automatically exposed as an individual MCP tool.
* **Management Tools:**
    * `get_prompt_names`: Lists all currently available prompt tools (supports filtering by category and tags).
    * `search_prompts`: Searches prompts based on keywords, categories, and tags with pagination support.
    * `get_prompt_details`: Retrieves detailed information about a specific prompt.
    * `reload_prompts`: Reloads all prompt files from the disk, updating the available tools.
* **Dynamic Prompt Creation and Management:**
    * `add_new_prompt`: Dynamically adds new prompts without manually creating files and restarting.
    * `update_prompt`: Updates existing prompts with new content or metadata.
    * `delete_prompt`: Removes prompts from the server.
* **Batch Operations:**
    * `export_prompts`: Exports prompts based on filters for backup or migration.
    * `import_prompts`: Imports multiple prompts at once.
    * `batch_update_prompts`: Updates multiple prompts with the same changes.
* **Metadata Support:**
    * `get_all_tags`: Retrieves all tags and their usage frequency.
    * `get_all_categories`: Lists all categories and their usage frequency.
* **TypeScript-Based:** Written in TypeScript for enhanced robustness and maintainability.
* **Simple Deployment:** Supports local deployment with Express server for easy setup and testing.

## Project Structure

```
mcp-prompt-server/
├── src/
│   ├── index.ts         # Main server logic and tool definitions
│   ├── api-adapter.js   # API adapter for Express server
│   ├── config.ts        # Configuration management
│   ├── storage/         # Storage interface implementations
│   └── prompts/         # Directory containing prompt definition files (YAML)
├── public/              # Static files for web UI
├── ui/                  # Frontend UI code
├── server.js            # Express server implementation
├── package.json         # Project metadata and dependencies
├── tsconfig.json        # TypeScript compiler options
├── README.md            # English README
└── README_CN.md         # Chinese README
```

## Prerequisites

* [Node.js](https://nodejs.org/) (v18 or later recommended)
* [npm](https://www.npmjs.com/) (Node Package Manager) or [pnpm](https://pnpm.io/)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/xiiizoux/mcp-prompt-server.git
   cd mcp-prompt-server
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   # pnpm install
   ```

## Building the Project

The project is written in TypeScript and needs to be compiled to JavaScript:

```bash
npm run build
```

This command uses `tsc` (the TypeScript compiler) to compile files from `src/` to the `dist/` directory, as configured in `tsconfig.json`.

## Running the Server

To start the MCP Prompt Server:

```bash
npm run dev:full
```

This command will start both the backend server and the frontend UI development server. The backend server will run on port 9011 (or the port specified in your .env file), and the frontend UI will run on port 9010.

You can also run the backend and frontend separately:

```bash
# Run only the backend server
npm run dev

# Run only the frontend UI
npm run ui:dev
```

For production deployment, you can build the frontend and then start the server:

```bash
# Build the frontend
npm run ui:build

# Start the server
npm start
```

### Using the API

Once the server is running, you can interact with your MCP Prompt Server via HTTP requests:

```bash
curl -X POST http://localhost:9011/api/get_prompt_names \
  -H "Content-Type: application/json" \
  -d '{}'
```

This will return a JSON response with the available prompt names.

### Using the Web UI

You can also use the web UI to manage your prompts. Open your browser and navigate to:

```
http://localhost:9010
```

The web UI provides a user-friendly interface for managing prompts, categories, and tags.



## Configuration

The MCP Prompt Server uses a `.env` file for configuration. You can copy the `.env.example` file to create your own `.env` file:

```bash
cp .env.example .env
```

The main configuration options include:

- **PORT**: The port for the backend server (default: 9011)
- **HOST**: The host for the backend server (default: localhost)
- **FRONTEND_PORT**: The port for the frontend development server (default: 9010)
- **STORAGE_TYPE**: The storage type to use (currently only supports 'file')
- **PROMPTS_DIR**: The directory to store prompt files (default: ./prompts)
- **PROMPTS_FILE**: The file to store prompts (default: prompts.json)

## Development

For development, you can use the following commands:
```bash
# Run the server with nodemon for auto-reloading
npm run dev

# Run the frontend UI development server
npm run ui:dev

# Run both backend and frontend together
npm run dev:full
```

After the server starts, you'll see output similar to:

```
MCP Prompt Server 正在运行，端口: 9011
访问 http://localhost:9011 使用 Web UI
```

You can now access http://localhost:9011 in your browser to use the server, or http://localhost:9010 to use the development UI.

**Managing Prompts**

During development, you can manage prompts using the web UI or the API:

1. Using the Web UI: Navigate to http://localhost:9010 and use the interface to add, update, or delete prompts.

2. Using the API: Send HTTP requests to the server to manage prompts:

```bash
# Add a new prompt
curl -X POST http://localhost:9011/api/add_new_prompt \
  -H "Content-Type: application/json" \
  -d '{"name":"example_prompt","description":"An example prompt","category":"Examples","tags":["example","demo"],"messages":[{"role":"system","content":"You are a helpful assistant."}]}'
```

**Debugging Tips**

- During local development, you can see log output in the console
- Use `console.log()` to debug your code
- The server uses nodemon, so it will automatically restart when you make changes to the code

## Production Deployment

For production deployment, you can build the frontend and then start the server:

```bash
# Build the frontend
npm run ui:build

# Start the server
npm start
```

This will build the frontend UI and place it in the `public` directory, which will be served by the Express server.

## API Reference

The MCP Prompt Server provides a RESTful API for managing prompts. All API endpoints use JSON for requests and responses.

### API Endpoints

| Endpoint | Method | Description |
|---------|------|------|
| `/api/get_prompt_names` | POST | Get all available prompt names |
| `/api/search_prompts` | POST | Search prompts with filtering and pagination |
| `/api/get_prompt_details` | POST | Get details of a specific prompt |
| `/api/add_new_prompt` | POST | Add a new prompt |
| `/api/update_prompt` | POST | Update an existing prompt |
| `/api/delete_prompt` | POST | Delete a prompt |
| `/api/get_all_categories` | POST | Get all categories |
| `/api/get_all_tags` | POST | Get all tags |
| `/api/get_settings` | POST | Get server settings |
| `/api/update_settings` | POST | Update server settings |

### Request and Response Examples

1. **Get Prompt Names**

   ```bash
   curl -X POST http://localhost:9011/api/get_prompt_names \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

   Response:
   ```json
   {
     "promptNames": ["general_assistant", "code_assistant", "writing_assistant"]
   }
   ```

2. **Search Prompts**

   ```bash
   curl -X POST http://localhost:9011/api/search_prompts \
     -H "Content-Type: application/json" \
     -d '{
       "query": "code",
       "page": 1,
       "pageSize": 10
     }'
   ```

   Response:
   ```json
   {
     "prompts": [
       {
         "name": "code_assistant",
         "description": "代码助手提示词，用于编程和代码相关问题",
         "category": "编程",
         "tags": ["代码", "编程", "开发"]
       }
     ],
     "total": 1,
     "page": 1,
     "pageSize": 10
   }
   ```

3. **Add New Prompt**

   ```bash
   curl -X POST http://localhost:9011/api/add_new_prompt \
     -H "Content-Type: application/json" \
     -d '{
       "name": "test_greeting",
       "description": "A simple greeting prompt",
       "category": "Examples",
       "tags": ["greeting", "example"],
       "parameters": [
         { "name": "user_name", "type": "string", "description": "Username", "required": true },
         { "name": "time_of_day", "type": "string", "description": "Time of day", "required": false, "default": "morning" }
       ],
       "messages": [
         {
           "role": "system",
           "content": "Good {{time_of_day}}, {{user_name}}! Hope you're having a great day."
         }
       ]
     }'
   ```

   Response:
   ```json
   {
     "success": true
   }
   ```

4. **Get Prompt Details**

   ```bash
   curl -X POST http://localhost:9011/api/get_prompt_details \
     -H "Content-Type: application/json" \
     -d '{
       "name": "code_assistant"
     }'
   ```

   Response:
   ```json
   {
     "prompt": {
       "name": "code_assistant",
       "description": "代码助手提示词，用于编程和代码相关问题",
       "category": "编程",
       "tags": ["代码", "编程", "开发"],
       "parameters": [],
       "messages": [
         {
           "role": "system",
           "content": "你是一个专业的编程助手，能够帮助用户解决各种编程问题，提供代码示例和解释。"
         }
       ],
       "createdAt": "2025-05-24T14:42:31.123Z",
       "updatedAt": "2025-05-24T14:42:31.123Z"
     }
   }
   ```

**Integration with Other Applications**

You can integrate the MCP Prompt Server API with any programming language or tool that supports HTTP requests. Here's a simple integration example using JavaScript:

```javascript
async function getPrompts() {
  const response = await fetch('http://localhost:9011/api/get_prompt_names', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  
  return await response.json();
}

// Usage example
getPrompts()
  .then(result => console.log(result.promptNames))
  .catch(error => console.error('Error:', error));
```

**Security Considerations**

In a production environment, you may want to add authentication and authorization mechanisms to your API. This can be achieved through:

1. Using API keys: Add authorization tokens in request headers
2. Implementing IP whitelisting or other access control mechanisms
3. Setting up HTTPS for secure communication

## Prompts

## 提示词管理

提示词是用于引导 LLM（大型语言模型）执行特定任务的指令集合。在 MCP Prompt Server 中，提示词以 JSON 格式存储在内存中，并可以通过 API 进行管理。

### 提示词结构

每个提示词包含以下字段：

* `name` (string, 必需): 提示词的唯一标识符。
* `description` (string, 可选): 提示词的描述信息。
* `category` (string, 可选): 提示词所属的类别。
* `tags` (array of strings, 可选): 与提示词相关的标签。
* `parameters` (array of objects, 可选): 提示词的参数定义。每个参数对象包含：
  * `name` (string, 必需): 参数名称。
  * `type` (string, 必需): 参数类型，如 "string"、"number"、"boolean" 等。
  * `description` (string, 可选): 参数描述。
  * `required` (boolean, 可选): 参数是否必需。
  * `default` (any, 可选): 参数的默认值。
* `messages` (array of objects, 必需): 定义对话结构。每个消息对象包含：
  * `role` (string, 必需): 发言者的角色（如 "system"、"user"、"assistant"）。
  * `content` (string, 必需): 消息内容，可以包含 `{{parameter_name}}` 形式的参数占位符。
* `createdAt` (string, 自动生成): 提示词创建时间。
* `updatedAt` (string, 自动生成): 提示词最后更新时间。

**示例：**

```json
{
  "name": "general_assistant",
  "description": "通用助手提示词，用于日常对话和问答",
  "category": "通用",
  "tags": ["对话", "助手", "基础"],
  "parameters": [
    {
      "name": "username",
      "type": "string",
      "description": "用户名称",
      "required": false,
      "default": "用户"
    }
  ],
  "messages": [
    {
      "role": "system",
      "content": "你是一个有用的AI助手，能够回答{{username}}的各种问题并提供帮助。"
    }
  ],
  "createdAt": "2025-05-24T14:42:31.123Z",
  "updatedAt": "2025-05-24T14:42:31.123Z"
}
```

### 默认提示词

MCP Prompt Server 内置了几个默认提示词：

* `general_assistant`: 通用助手提示词，用于日常对话和问答
* `code_assistant`: 代码助手提示词，用于编程和代码相关问题
* `writing_assistant`: 写作助手提示词，用于文章创作和内容优化

## 管理功能

MCP Prompt Server 提供了一系列 API 管理功能，用于管理提示词、类别和标签。

### 提示词管理

* **获取提示词列表** (`get_prompt_names`)
  * **输入：** 可选的类别和标签过滤器
  * **输出：** 可用提示词名称列表

* **搜索提示词** (`search_prompts`)
  * **输入：** 搜索查询、类别过滤器、标签过滤器、分页参数
  * **输出：** 匹配的提示词列表，包含元数据

* **获取提示词详情** (`get_prompt_details`)
  * **输入：** 要检索的提示词名称
  * **输出：** 完整的提示词定义，包括所有元数据和消息

* **添加新提示词** (`add_new_prompt`)
  * **输入：** 完整的提示词定义
  * **输出：** 确认提示词已添加的成功消息

* **更新提示词** (`update_prompt`)
  * **输入：** 要更新的提示词名称和更新后的提示词定义
  * **输出：** 确认提示词已更新的成功消息

* **删除提示词** (`delete_prompt`)
  * **输入：** 要删除的提示词名称
  * **输出：** 确认提示词已删除的成功消息

### 类别和标签管理

* **获取所有类别** (`get_all_categories`)
  * **输入：** 无
  * **输出：** 所有可用类别的列表

* **获取所有标签** (`get_all_tags`)
  * **输入：** 无
  * **输出：** 所有可用标签的列表

## Contributing

Contributions are welcome! Please feel free to open an issue on the project's repository to discuss bugs or suggest features, or submit a pull request with your improvements.
