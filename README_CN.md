# MCP 提示词服务器

## 概述

MCP 提示词服务器是一个多功能工具，提供一系列大型语言模型 (LLM) 提示词作为可调用工具。它支持本地和远程部署，具有灵活的存储选项，包括本地文件存储和 Supabase 数据库存储。服务器允许动态加载提示词，并提供用于管理和交互这些提示词的工具。该工具旨在通过提供结构化提示词来引导 Claude 等 AI 模型执行特定任务。

## 特性

* **灵活的存储选项：**
    * **文件存储：** 从位于 `src/prompts` 目录中的 YAML 文件加载和保存提示词定义。
    * **Supabase 存储：** 将提示词存储在 Supabase PostgreSQL 数据库中，实现跨部署的持久化存储。
    * **基于环境的配置：** 使用环境变量轻松切换存储选项。
* **用户认证：**
    * 通过 Supabase Auth 实现安全的用户认证。
    * 提供登录、注册和注销功能。
    * 为受保护的 API 路由提供 JWT 令牌验证。
* **MCP 工具集成：** 提供一套用于管理提示词的 MCP 工具。
* **核心管理工具：**
    * `get_prompt_names`：列出所有当前可用的提示词名称。
    * `get_prompt_details`：获取特定提示词的详细信息。
    * `reload_prompts`：从选定的存储中重新加载所有提示词。
* **提示词模板支持：**
    * `get_prompt_template`：提供用于创建新提示词的 YAML 模板。
    * `create_prompt`：创建新提示词并保存到选定的存储中。
* **基于 TypeScript：** 使用 TypeScript 编写，以增强健壮性和可维护性。
* **部署选项：**
    * 使用 Express 服务器进行本地部署。
    * 使用 Supabase 集成部署到 Vercel。

## 项目结构

```
mcp-prompt-server/
├── api/
│   └── index.js         # API 入口点，用于 HTTP 服务器
├── src/
│   ├── index.ts         # 主要 MCP 工具实现
│   ├── types.ts         # TypeScript 类型定义
│   ├── prompts/         # 包含提示词定义文件的目录 (YAML)
│   ├── templates/       # 包含新提示词模板的目录
│   └── storage/         # 存储适配器
│       ├── file-adapter.ts    # 文件存储实现
│       └── supabase-adapter.ts # Supabase 存储实现
├── scripts/
│   └── switch-storage.js # 在存储选项之间切换的脚本
├── supabase/
│   └── schema.sql       # Supabase 数据库设置的 SQL 脚本
├── server.js            # 用于本地部署的 Express 服务器
├── mcp_config.json      # MCP 配置文件
├── package.json         # 项目元数据和依赖项
├── tsconfig.json        # TypeScript 编译器选项
├── .env.example         # 环境配置示例
├── README.md            # 英文 README
└── README_CN.md         # 中文 README
```

## 先决条件

* [Node.js](https://nodejs.org/) (建议 v18 或更高版本)
* [npm](https://www.npmjs.com/) (Node 包管理器) 或 [pnpm](https://pnpm.io/)

## 安装

1. 克隆仓库：
   ```bash
   git clone https://github.com/xiiizoux/mcp-prompt-server.git
   cd mcp-prompt-server
   ```

2. 安装依赖：
   ```bash
   npm install
   # 或
   # pnpm install
   ```

3. 配置环境变量：
   ```bash
   # 复制环境变量示例文件
   cp .env.example .env
   
   # 编辑 .env 文件设置您的配置
   # 特别是 Supabase 集成部分
   ```

## 构建项目

项目使用 TypeScript 编写，需要编译为 JavaScript：

```bash
npm run build
```

此命令使用 `tsc`（TypeScript 编译器）将 `src/` 中的文件编译到 `dist/` 目录，如 `tsconfig.json` 中配置的那样。

## 部署方法

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

## 作为 MCP 工具运行

要将 MCP 提示词服务器作为工具使用：

1. 配置 MCP 配置文件（`mcp_config.json`）以包含提示词服务器工具：

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

2. 使用此配置文件启动 MCP 服务器。

3. 提示词服务器将作为 MCP 工具可用，具有以下功能：
   - `get_prompt_names`
   - `get_prompt_details`
   - `reload_prompts`
   - `get_prompt_template`
   - `create_prompt`

## 部署到 Vercel

MCP 提示词服务器也可以部署到 Vercel 作为无服务器 API。这允许您通过 HTTP 端点远程访问提示词服务器。

### 部署步骤

1. 安装 Vercel CLI（如果尚未安装）：
   ```bash
   npm install -g vercel
   ```

2. 构建项目：
   ```bash
   npm run build
   ```

3. 部署到 Vercel：
   ```bash
   vercel
   ```

4. 生产环境部署：
   ```bash
   vercel --prod
   ```

### API 端点

以下 API 端点可用：

#### 核心端点

| 端点 | 方法 | 描述 | 需要认证 |
|----------|--------|-------------|------------------------|
| `/api/health` | GET | 健康检查端点 | 否 |
| `/api/get_prompt_names` | POST | 获取所有可用的提示词名称 | 否 |
| `/api/get_prompt_details` | POST | 获取特定提示词的详细信息 | 否 |
| `/api/reload_prompts` | POST | 从选定的存储中重新加载所有提示词 | 是 |
| `/api/get_prompt_template` | POST | 获取用于创建新提示词的 YAML 模板 | 否 |
| `/api/create_prompt` | POST | 创建新提示词并保存到选定的存储中 | 是 |

#### 认证端点（仅 Supabase）

| 端点 | 方法 | 描述 | 需要认证 |
|----------|--------|-------------|------------------------|
| `/api/auth/register` | POST | 注册新用户 | 否 |
| `/api/auth/login` | POST | 使用电子邮件和密码登录 | 否 |
| `/api/auth/logout` | POST | 注销当前用户 | 是 |

### API 使用示例

#### 基本用法

1. **获取提示词名称**：
   ```bash
   curl -X POST http://localhost:9010/api/get_prompt_names
   ```

2. **获取提示词详情**：
   ```bash
   curl -X POST http://localhost:9010/api/get_prompt_details \
     -H "Content-Type: application/json" \
     -d '{"name":"code_assistant"}'
   ```

#### 认证（仅 Supabase）

1. **注册新用户**：
   ```bash
   curl -X POST http://localhost:9010/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"securepassword","displayName":"Example User"}'
   ```

2. **登录**：
   ```bash
   curl -X POST http://localhost:9010/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"securepassword"}'
   ```
   这将返回一个 JWT 令牌，您应该在认证请求中使用它。

3. **创建提示词（需认证）**：
   ```bash
   curl -X POST http://localhost:9010/api/create_prompt \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"name":"my_prompt","description":"我的自定义提示词","category":"自定义","tags":["自定义","示例"],"messages":[{"role":"system","content":{"type":"text","text":"你是一个有用的助手。"}}]}'
   ```

4. **注销**：
   ```bash
   curl -X POST http://localhost:9010/api/auth/logout \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

### Vercel 环境考虑

当部署到 Vercel 时，MCP 提示词服务器可以使用 Supabase 进行持久化存储。这提供了几个优势：

- **持久化存储**：所有提示词都存储在 Supabase 数据库中，在函数调用之间保持持久。
- **用户认证**：Supabase 为 API 端点提供安全认证。
- **环境检测**：服务器自动检测何时在 Vercel 环境中运行并相应调整。

#### 使用 Supabase 部署到 Vercel

要使用 Supabase 集成部署到 Vercel：

1. 按照 Supabase 集成部分中的描述设置您的 Supabase 项目。
2. 在 Vercel 项目设置中添加以下环境变量：
   - `STORAGE_TYPE=supabase`
   - `SUPABASE_URL=https://your-project-id.supabase.co`
   - `SUPABASE_ANON_KEY=your-anon-key`
   - `VERCEL=1`
3. 使用 Vercel CLI 或 GitHub 集成将项目部署到 Vercel。

## 配置

### MCP 配置

MCP 提示词服务器通过 MCP 配置文件（`mcp_config.json`）进行配置：

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

### 环境配置

服务器可以使用 `.env` 文件中的环境变量进行配置：

```bash
# 存储配置
# 可选值: file, supabase
STORAGE_TYPE=file

# Supabase 配置
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Vercel 环境标识
VERCEL=0

# API 服务器配置
PORT=9010

# 本地开发配置
# 如果设置为 true，则强制使用文件存储，即使 STORAGE_TYPE=supabase
FORCE_LOCAL_STORAGE=false
```

### 存储选项

MCP 提示词服务器支持两种存储选项：

1. **文件存储**：将提示词存储为 `src/prompts` 目录中的 YAML 文件。这适合本地开发和测试。

2. **Supabase 存储**：将提示词存储在 Supabase PostgreSQL 数据库中。这推荐用于生产部署，以及当您需要跨环境的持久化存储时。

您可以使用提供的脚本在存储选项之间切换：

```bash
# 切换到文件存储
npm run use:file

# 切换到 Supabase 存储
npm run use:supabase
```

## Supabase 集成

### 设置 Supabase

1. 在 [https://supabase.com](https://supabase.com) 创建 Supabase 账户和项目。
2. 从项目设置中获取您的 Supabase URL 和匿名密钥。
3. 将这些值添加到您的 `.env` 文件中：
   ```bash
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   STORAGE_TYPE=supabase
   ```

### 数据库结构

要在 Supabase 中设置所需的数据库表，使用 `supabase/schema.sql` 文件中提供的 SQL 脚本。您可以将此 SQL 复制并粘贴到 Supabase SQL 编辑器中：

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

### 认证

使用 Supabase 时，MCP 提示词服务器包含认证端点：

- `/api/auth/register`：注册新用户
- `/api/auth/login`：使用电子邮件和密码登录
- `/api/auth/logout`：注销当前用户

受保护的 API 路由需要在 Authorization 头中提供有效的 JWT 令牌。

## 运行服务器

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

服务器启动后，您将看到类似于以下的输出：

```
API 存储方式: Supabase (或 File)
API 运行环境: 本地
API 身份验证: 已启用 (当使用 Supabase 时)
MCP Prompt Server API 运行在 http://localhost:9010
可用端点:
- GET  /api/health
- POST /api/get_prompt_names
- POST /api/get_prompt_details
- POST /api/reload_prompts
- POST /api/get_prompt_template
- POST /api/create_prompt
- POST /api/auth/login (当使用 Supabase 时)
- POST /api/auth/register (当使用 Supabase 时)
- POST /api/auth/logout (当使用 Supabase 时)
```
可用工具: get_prompt_names, get_prompt_details, reload_prompts, get_prompt_template, create_prompt
```