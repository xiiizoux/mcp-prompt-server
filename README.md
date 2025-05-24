# MCP Prompt Server

## Overview

The MCP Prompt Server is a versatile tool that provides a collection of Large Language Model (LLM) prompts as callable tools. It supports both local and remote deployments, with flexible storage options including local file storage and Supabase database storage. The server allows for dynamic loading of prompts and provides tools for managing and interacting with these prompts. This tool is designed to guide AI models like Claude in performing specific tasks by providing them with structured prompts.

## Features

* **Flexible Storage Options:**
    * **File Storage:** Loads and saves prompt definitions from/to YAML files located in the `src/prompts` directory.
    * **Supabase Storage:** Stores prompts in a Supabase PostgreSQL database for persistent storage across deployments.
    * **Environment-based Configuration:** Easily switch between storage options using environment variables.
* **User Authentication:**
    * Secure user authentication via Supabase Auth.
    * Login, registration, and logout functionality.
    * JWT token verification for protected API routes.
* **MCP Tool Integration:** Provides a set of MCP tools for managing prompts.
* **Core Management Tools:**
    * `get_prompt_names`: Lists all currently available prompt names.
    * `get_prompt_details`: Retrieves detailed information about a specific prompt.
    * `reload_prompts`: Reloads all prompts from the selected storage.
* **Prompt Template Support:**
    * `get_prompt_template`: Provides a YAML template for creating new prompts.
    * `create_prompt`: Creates new prompts and saves them to the selected storage.
* **TypeScript-Based:** Written in TypeScript for enhanced robustness and maintainability.
* **Deployment Options:**
    * Local deployment with Express server.
    * Remote deployment to Vercel with Supabase integration.

## Project Structure

```
mcp-prompt-server/
├── api/
│   └── index.js         # API entry point for HTTP server
├── src/
│   ├── index.ts         # Main MCP tool implementation
│   ├── types.ts         # TypeScript type definitions
│   ├── prompts/         # Directory containing prompt definition files (YAML)
│   ├── templates/       # Directory containing templates for new prompts
│   └── storage/         # Storage adapters
│       ├── file-adapter.ts    # File storage implementation
│       └── supabase-adapter.ts # Supabase storage implementation
├── scripts/
│   └── switch-storage.js # Script to switch between storage options
├── supabase/
│   └── schema.sql       # SQL script for Supabase database setup
├── server.js            # Express server for local deployment
├── mcp_config.json      # MCP configuration file
├── package.json         # Project metadata and dependencies
├── tsconfig.json        # TypeScript compiler options
├── .env.example         # Example environment configuration
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

3. Configure environment variables:
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit the .env file to set your configuration
   # Especially for Supabase integration
   ```

## Building the Project

The project is written in TypeScript and needs to be compiled to JavaScript:

```bash
npm run build
```

This command uses `tsc` (the TypeScript compiler) to compile files from `src/` to the `dist/` directory, as configured in `tsconfig.json`.

## Running as an MCP Tool

To use the MCP Prompt Server as a tool:

1. Configure the MCP configuration file (`mcp_config.json`) to include the prompt server tool:

```json
{
  "tools": [
    {
      "name": "prompt-server",
      "command": "./dist/src/index.js"
    }
  ]
}
```

2. Start the MCP server with this configuration file.

3. The prompt server will be available as an MCP tool with the following functions:
   - `get_prompt_names`
   - `get_prompt_details`
   - `reload_prompts`
   - `get_prompt_template`
   - `create_prompt`

For development purposes, you can also run the tool directly:

```bash
npm start
```

## Deploying to Vercel

The MCP Prompt Server can also be deployed to Vercel as a serverless API. This allows you to access the prompt server remotely via HTTP endpoints.

### Deployment Steps

1. Install Vercel CLI (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Deploy to Vercel:
   ```bash
   vercel
   ```

4. For production deployment:
   ```bash
   vercel --prod
   ```

### API Endpoints

The following API endpoints are available:

#### Core Endpoints

| Endpoint | Method | Description | Authentication Required |
|----------|--------|-------------|------------------------|
| `/api/health` | GET | Health check endpoint | No |
| `/api/get_prompt_names` | POST | Get all available prompt names | No |
| `/api/get_prompt_details` | POST | Get details of a specific prompt | No |
| `/api/reload_prompts` | POST | Reload all prompts from the selected storage | Yes |
| `/api/get_prompt_template` | POST | Get the YAML template for creating new prompts | No |
| `/api/create_prompt` | POST | Create a new prompt and save it to the selected storage | Yes |

#### Authentication Endpoints (Supabase Only)

| Endpoint | Method | Description | Authentication Required |
|----------|--------|-------------|------------------------|
| `/api/auth/register` | POST | Register a new user | No |
| `/api/auth/login` | POST | Login with email and password | No |
| `/api/auth/logout` | POST | Logout the current user | Yes |

### API Usage Examples

#### Basic Usage

1. **Get Prompt Names**:
   ```bash
   curl -X POST http://localhost:9010/api/get_prompt_names
   ```

2. **Get Prompt Details**:
   ```bash
   curl -X POST http://localhost:9010/api/get_prompt_details \
     -H "Content-Type: application/json" \
     -d '{"name":"code_assistant"}'
   ```

#### Authentication (Supabase Only)

1. **Register a New User**:
   ```bash
   curl -X POST http://localhost:9010/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"securepassword","displayName":"Example User"}'
   ```

2. **Login**:
   ```bash
   curl -X POST http://localhost:9010/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"securepassword"}'
   ```
   This will return a JWT token that you should use for authenticated requests.

3. **Create Prompt (Authenticated)**:
   ```bash
   curl -X POST http://localhost:9010/api/create_prompt \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"name":"my_prompt","description":"My custom prompt","category":"Custom","tags":["custom","example"],"messages":[{"role":"system","content":{"type":"text","text":"You are a helpful assistant."}}]}'
   ```

4. **Logout**:
   ```bash
   curl -X POST http://localhost:9010/api/auth/logout \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

### Vercel Environment Considerations

When deployed to Vercel, the MCP Prompt Server can use Supabase for persistent storage. This provides several advantages:

- **Persistent Storage**: All prompts are stored in the Supabase database and persist between function invocations.
- **User Authentication**: Supabase provides secure authentication for API endpoints.
- **Environment Detection**: The server automatically detects when it's running in the Vercel environment and adjusts accordingly.

#### Vercel Deployment with Supabase

To deploy to Vercel with Supabase integration:

1. Set up your Supabase project as described in the Supabase Integration section.
2. Add the following environment variables in your Vercel project settings:
   - `STORAGE_TYPE=supabase`
   - `SUPABASE_URL=https://your-project-id.supabase.co`
   - `SUPABASE_ANON_KEY=your-anon-key`
   - `VERCEL=1`
3. Deploy your project to Vercel using the Vercel CLI or GitHub integration.


## Configuration

### MCP Configuration

The MCP Prompt Server is configured through the MCP configuration file (`mcp_config.json`):

```json
{
  "tools": [
    {
      "name": "prompt-server",
      "command": "./dist/src/index.js"
    }
  ]
}
```

### Environment Configuration

The server can be configured using environment variables in the `.env` file:

```bash
# Storage configuration
# Available options: file, supabase
STORAGE_TYPE=file

# Supabase configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Vercel environment flag
VERCEL=0

# API server configuration
PORT=9010

# Local development configuration
# If set to true, forces file storage even if STORAGE_TYPE=supabase
FORCE_LOCAL_STORAGE=false
```

### Storage Options

The MCP Prompt Server supports two storage options:

1. **File Storage**: Stores prompts as YAML files in the `src/prompts` directory. This is suitable for local development and testing.

2. **Supabase Storage**: Stores prompts in a Supabase PostgreSQL database. This is recommended for production deployments and when you need persistent storage across environments.

You can switch between storage options using the provided script:

```bash
# Switch to file storage
npm run use:file

# Switch to Supabase storage
npm run use:supabase
```

## Supabase Integration

### Setting Up Supabase

1. Create a Supabase account and project at [https://supabase.com](https://supabase.com).
2. Get your Supabase URL and anon key from the project settings.
3. Add these values to your `.env` file:
   ```bash
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   STORAGE_TYPE=supabase
   ```

### Database Schema

To set up the required database tables in Supabase, use the SQL script provided in the `supabase/schema.sql` file. You can copy and paste this SQL into the Supabase SQL Editor:

```sql
-- MCP Prompt Server 数据库结构
-- 在 Supabase SQL 编辑器中执行此脚本

-- 提示词表
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[],
  messages JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户表（用于身份验证）
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加一些默认提示词
INSERT INTO prompts (name, description, category, tags, messages, created_at, updated_at)
VALUES 
  (
    'general_assistant',
    '通用助手提示词，用于日常对话和问答',
    '通用',
    ARRAY['对话', '助手', '基础'],
    '[{"role":"system","content":{"type":"text","text":"你是一个有用的AI助手，能够回答用户的各种问题并提供帮助。"}}]'::JSONB,
    NOW(),
    NOW()
  ),
  (
    'code_assistant',
    '代码助手提示词，用于编程和代码相关问题',
    '编程',
    ARRAY['代码', '编程', '开发'],
    '[{"role":"system","content":{"type":"text","text":"你是一个专业的编程助手，能够帮助用户解决各种编程问题，提供代码示例和解释。\n\n请遵循以下原则：\n1. 提供清晰、简洁的代码示例\n2. 解释代码的工作原理\n3. 指出潜在的问题和优化方向\n4. 使用最佳实践和设计模式\n\n你精通多种编程语言，包括但不限于：JavaScript、TypeScript、Python、Java、C++、Go等。"}}]'::JSONB,
    NOW(),
    NOW()
  )
ON CONFLICT (name) DO NOTHING;
```

### Authentication

The MCP Prompt Server includes authentication endpoints when using Supabase:

- `/api/auth/register`: Register a new user
- `/api/auth/login`: Login with email and password
- `/api/auth/logout`: Logout the current user

Protected API routes require a valid JWT token in the Authorization header.

## Deployment Methods

MCP Prompt Server 支持两种部署方式：本地部署（使用文件存储）和远程部署（使用 Supabase 存储）。

### 1. 本地部署（使用文件存储）

本地部署适合开发和测试环境，使用文件系统存储提示词。

```bash
# 切换到文件存储模式
npm run use:file

# 构建项目
npm run build

# 启动 HTTP 服务器
npm run server
```

本地部署的特点：
- 提示词存储在 `src/prompts` 目录的 YAML 文件中
- 无需外部数据库依赖
- 适合快速开发和测试
- 无需身份验证

### 2. 远程部署（使用 Supabase 存储）

远程部署适合生产环境，使用 Supabase 数据库存储提示词，支持身份验证。

#### 在本地使用 Supabase 存储

```bash
# 切换到 Supabase 存储模式
npm run use:supabase

# 构建项目
npm run build

# 启动 HTTP 服务器
npm run server
```

#### 部署到 Vercel

```bash
# 构建项目
npm run build

# 部署到 Vercel
vercel

# 生产环境部署
vercel --prod
```

在 Vercel 项目设置中添加以下环境变量：
- `STORAGE_TYPE=supabase`
- `SUPABASE_URL=https://your-project-id.supabase.co`
- `SUPABASE_ANON_KEY=your-anon-key`
- `VERCEL=1`

远程部署的特点：
- 提示词存储在 Supabase 数据库中
- 支持用户身份验证
- 提供持久化存储
- 适合生产环境
- 支持多环境部署（开发、测试、生产）

## Running the Server

无论使用哪种部署方式，您都可以通过以下两种方式运行 MCP Prompt Server：

### 1. 作为 MCP 工具

```bash
# 构建 TypeScript 代码
npm run build

# 直接运行工具
npm start
```

### 2. 作为 HTTP 服务器

```bash
# 构建 TypeScript 代码
npm run build

# 启动 HTTP 服务器
npm run server
```

After the server starts, you'll see output similar to:

```
API 存储方式: Supabase (or File)
API 运行环境: 本地
API 身份验证: 已启用 (when using Supabase)
MCP Prompt Server API 运行在 http://localhost:9010
可用端点:
- GET  /api/health
- POST /api/get_prompt_names
- POST /api/get_prompt_details
- POST /api/reload_prompts
- POST /api/get_prompt_template
- POST /api/create_prompt
- POST /api/auth/login (when using Supabase)
- POST /api/auth/register (when using Supabase)
- POST /api/auth/logout (when using Supabase)
```
可用工具: get_prompt_names, get_prompt_details, reload_prompts, get_prompt_template, create_prompt
```

**Debugging Tips**

- During development, you can see log output in the console
- Use `console.log()` to debug your code
- The tool will automatically reload prompts when you call the `reload_prompts` function

## MCP Tool Reference

The MCP Prompt Server provides the following tools through the MCP protocol:

### Available Tools

| Tool Name | Description |
|---------|------|
| `get_prompt_names` | Get all available prompt names |
| `get_prompt_details` | Get details of a specific prompt |
| `reload_prompts` | Reload all prompts from the directory |
| `get_prompt_template` | Get the YAML template for creating new prompts |
| `create_prompt` | Create a new prompt from YAML content |

### Tool Usage Examples

1. **Get Prompt Names**

   ```javascript
   // Through MCP framework
   const result = await mcpClient.callTool('prompt-server', 'get_prompt_names');
   console.log(result.data); // Array of prompt names
   ```

2. **Get Prompt Details**

   ```javascript
   // Through MCP framework
   const result = await mcpClient.callTool('prompt-server', 'get_prompt_details', {
     name: 'code_assistant'
   });
   console.log(result.data); // Prompt details
   ```

3. **Reload Prompts**

   ```javascript
   // Through MCP framework
   const result = await mcpClient.callTool('prompt-server', 'reload_prompts');
   console.log(result.message); // Confirmation message
   ```

4. **Get Prompt Template**

   ```javascript
   // Through MCP framework
   const result = await mcpClient.callTool('prompt-server', 'get_prompt_template');
   console.log(result.data); // YAML template for creating prompts
   ```

5. **Create Prompt**

   ```javascript
   // Through MCP framework
   const yamlContent = `
   name: greeting_prompt
   description: A simple greeting prompt
   category: Examples
   tags:
     - greeting
     - example
   arguments:
     - name: user_name
       description: User's name
       required: true
     - name: time_of_day
       description: Time of day (morning, afternoon, evening)
       required: false
   messages:
     - role: user
       content:
         type: text
         text: |
           Good {{time_of_day}}, {{user_name}}! Hope you're having a great day.
   `;
   
   const result = await mcpClient.callTool('prompt-server', 'create_prompt', {
     name: 'greeting_prompt',
     content: yamlContent
   });
   console.log(result.message); // Confirmation message
   ```

## Integration with AI Assistants

One of the key features of the MCP Prompt Server is its ability to work with AI assistants like Claude to create and manage prompts. Here's a typical workflow:

1. **Get the prompt template** using the `get_prompt_template` tool
2. **Ask the AI** to fill in the template based on your requirements
3. **Create the prompt** using the `create_prompt` tool with the AI-generated content

This allows for a collaborative process where the AI helps design effective prompts that can then be saved and reused.

## Prompts

### Prompt Structure

Prompts in the MCP Prompt Server are defined in YAML format and stored in the `src/prompts` directory. Each prompt file contains the following fields:

* `name` (string, required): The unique identifier for the prompt.
* `description` (string, optional): A description of what the prompt does.
* `category` (string, optional): The category the prompt belongs to.
* `tags` (array of strings, optional): Tags associated with the prompt.
* `arguments` (array of objects, optional): Parameters that can be passed to the prompt. Each parameter object contains:
  * `name` (string, required): The parameter name.
  * `description` (string, optional): Description of the parameter.
  * `required` (boolean, optional): Whether the parameter is required.
* `messages` (array of objects, required): Defines the conversation structure. Each message object contains:
  * `role` (string, required): The speaker's role (e.g., "system", "user", "assistant").
  * `content` (object, required): The message content, typically with:
    * `type`: "text"
    * `text`: The message text, which can contain parameter placeholders like `{{parameter_name}}`.

**Example:**

```yaml
name: greeting_prompt
description: A simple greeting prompt
category: Examples
tags:
  - greeting
  - example
arguments:
  - name: user_name
    description: User's name
    required: true
  - name: time_of_day
    description: Time of day (morning, afternoon, evening)
    required: false
messages:
  - role: user
    content:
      type: text
      text: |
        Good {{time_of_day}}, {{user_name}}! Hope you're having a great day.
```

### Default Prompts

The MCP Prompt Server comes with several default prompts in the `src/prompts` directory, including:

* `general_assistant`: A general-purpose assistant prompt for everyday conversation
* `code_assistant`: A code assistant prompt for programming-related questions
* `writing_assistant`: A writing assistant prompt for content creation
* `api_documentation`: A prompt for generating API documentation

## Contributing

Contributions are welcome! Please feel free to open an issue on the project's repository to discuss bugs or suggest features, or submit a pull request with your improvements.

## Contributing

Contributions are welcome! Please feel free to open an issue on the project's repository to discuss bugs or suggest features, or submit a pull request with your improvements.
