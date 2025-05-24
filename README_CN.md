# MCP Prompt 服务器

## 概述

MCP Prompt 服务器是一个 Node.js 应用程序，它利用模型上下文协议 (MCP) 将一系列大型语言模型 (LLM) 提示作为可调用工具公开。它允许从本地文件动态加载提示，并提供用于管理这些提示并与之交互的工具。此服务器旨在通过为 AI 模型（如 Claude）提供结构化提示来指导它们执行特定任务。

## 特性

*   **动态提示加载：** 从位于 `src/prompts` 目录中的 YAML 文件加载提示定义。
*   **MCP 工具暴露：** 每个加载的提示都会自动作为单独的 MCP 工具公开。
*   **管理工具：**
    *   `get_prompt_names`：列出所有当前可用的提示工具。
    *   `reload_prompts`：从磁盘重新加载所有提示文件，更新可用的工具。
*   **动态提示创建：**
    *   `add_new_prompt`：一个允许动态向服务器添加新提示的工具，无需手动创建文件和重新启动。
*   **基于 TypeScript：** 使用 TypeScript 编写，以增强健壮性和可维护性。

## 项目结构

```
mcp-prompt-server/
├── src/
│   ├── api-adapter.js    # API 适配器
│   ├── config.ts         # 配置管理
│   ├── storage/          # 存储接口实现
│   └── prompts/          # 提示词存储目录
├── server.js            # Express 服务器入口文件
├── package.json         # 项目元数据和依赖项
├── tsconfig.json        # TypeScript 编译器选项
├── README.md            # 英文版 README
└── README_CN.md         # 本中文版 README
```

## 先决条件

*   [Node.js](https://nodejs.org/) (建议 v18 或更高版本)
*   [npm](https://www.npmjs.com/) (Node 包管理器) 或 [pnpm](https://pnpm.io/)

## 安装

1.  克隆仓库：
    ```bash
    git clone https://github.com/xiiizoux/mcp-prompt-server.git
    cd mcp-prompt-server
    ```

2.  安装依赖：
    ```bash
    npm install
    ```

## 环境配置

项目使用文件存储方式，下面是设置环境的步骤：

### 1. 创建环境变量文件

复制示例环境变量文件：

```bash
cp .env.example .env
```

### 2. 配置环境变量

编辑 `.env` 文件，根据您的需求设置以下参数：

```
# 服务器配置
PORT=9011
HOST=localhost

# 存储配置
STORAGE_TYPE=file
PROMPTS_DIR=./prompts
PROMPTS_FILE=prompts.json

# 日志配置
LOG_LEVEL=info
LOG_REQUESTS=true

# 缓存配置
CACHE_ENABLED=true
```

## 运行服务器

运行 MCP Prompt 服务器：

```bash
# 开发模式
npm run dev
```

这个命令会启动服务器，并在文件变化时自动重新加载。服务器将在端口 9011（或您在 .env 文件中指定的端口）上运行。

对于生产部署：

```bash
# 启动服务器
npm start
```

### 使用 API

服务器运行后，您可以通过 HTTP 请求与 MCP Prompt 服务器交互：

```bash
curl -X POST http://localhost:9011/api/get_prompt_names \
  -H "Content-Type: application/json" \
  -d '{}'
```

这将返回一个包含可用提示词名称的 JSON 响应。


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

### 运行服务器和 UI

有两种方式可以运行 MCP Prompt Server：

#### 1. 同时运行后端服务器和前端 UI（推荐）

使用以下命令同时启动后端服务器和前端 UI：

```bash
npm run dev:full
```

这将使用 `concurrently` 同时启动后端服务器（监听在 `.env` 文件中配置的端口）和前端 UI（默认监听在 3000 端口）。

#### 2. 分别运行后端服务器和前端 UI

**启动后端服务器：**

```bash
npm run dev
```
此命令使用 `nodemon` 运行服务器，当文件变更时会自动重启。

**启动前端 UI：**

```bash
npm run ui:dev
```
此命令将启动前端 UI 开发服务器。

#### 生产部署

对于生产部署，可以使用以下命令：

```bash
npm start
```
此命令会首先构建项目（如果尚未构建），然后使用 `node server.js` 运行服务器。

### Cloudflare Workers 部署方式（基于 HTTP API）

本项目支持部署到 Cloudflare Workers，这使得您可以利用 Cloudflare 的全球分布式网络运行您的 MCP Prompt 服务器，无需管理服务器基础设施。Cloudflare Workers 部署方式使用 HTTP API 代替了标准输入/输出通信，并使用 Cloudflare KV 作为存储后端。

**主要优势：**

- **全球分布式部署**：利用 Cloudflare 的全球边缘网络，实现低延迟访问
- **无服务器管理**：无需维护服务器、操作系统或其他基础设施
- **自动扩展**：根据流量自动扩展，无需手动干预
- **HTTP API 接口**：提供标准的 HTTP API，方便与其他服务集成

#### 前期准备

1. **注册和配置 Cloudflare 账户**
   - 注册 [Cloudflare](https://dash.cloudflare.com/sign-up) 账户（如果您还没有）
   - 登录到 [Cloudflare Dashboard](https://dash.cloudflare.com)
   - 在侧边栏中，点击 "Workers & Pages" 以确保您的账户已启用 Workers

2. **安装项目依赖**
   ```bash
   npm install
   ```
   这将安装所有需要的依赖项，包括 Wrangler CLI。

3. **登录到 Wrangler**
   ```bash
   npx wrangler login
   ```
   这将打开浏览器，引导您完成 Cloudflare 账户的身份验证过程。

#### 创建 KV 命名空间

**Cloudflare KV 是什么？**

Cloudflare KV （Key-Value）是一个全球分布式的键值存储系统，在 Cloudflare Workers 中用于存储数据。在我们的项目中，KV 存储用于替代文件系统，存储所有的提示词定义。

**创建生产环境 KV 命名空间**

执行以下命令创建一个用于生产环境的 KV 命名空间：

```bash
npx wrangler kv:namespace create PROMPTS_KV
```

运行后，您将看到类似于以下的输出：

```
✅ Created namespace "PROMPTS_KV" with ID "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**更新配置文件**

复制输出中的 ID，然后编辑 `wrangler.toml` 文件，将 `your-kv-namespace-id-here` 替换为实际的 ID：

```toml
[[kv_namespaces]]
binding = "PROMPTS_KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" # 将这里替换为您的实际 ID
```

**创建开发环境 KV 命名空间**

同样，创建一个用于本地开发的预览 KV 命名空间：

```bash
npx wrangler kv:namespace create PROMPTS_KV --preview
```

并将输出的 ID 替换到 `wrangler.toml` 文件中的 `your-preview-kv-namespace-id-here`：

```toml
[[kv_namespaces]]
binding = "PROMPTS_KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" # 生产环境 ID
preview_id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy" # 开发环境 ID
```

**为什么需要两个 KV 命名空间？**

- **生产环境 ID**：用于实际部署到 Cloudflare Workers 的生产环境
- **预览 ID**：用于本地开发和测试，不会影响生产数据

#### 本地开发

**构建和运行本地开发服务器**

运行以下命令在本地开发和测试 Cloudflare Workers 版本：

```bash
npm run dev:worker
```

这个命令会执行以下操作：
1. 首先构建项目（`npm run build:worker`）
2. 然后使用 Wrangler 启动本地开发服务器

服务器启动后，您将看到类似于以下的输出：

```
[wrangler] Ready on http://localhost:8787
```

现在您可以在浏览器中访问 http://localhost:8787 来测试您的 API。

**开发时的提示词管理**

在开发过程中，您可能需要将提示词上传到 KV 存储中。您可以使用 API 或者直接使用 Wrangler CLI 来上传提示词：

```bash
# 使用 Wrangler 将提示词上传到 KV 存储
# 格式： npx wrangler kv:key put --binding=PROMPTS_KV --preview "key" "value"

# 例如，上传一个提示词（假设提示词内容已保存在 prompt.yaml 文件中）
npx wrangler kv:key put --binding=PROMPTS_KV --preview "prompts:example_prompt" "$(cat prompt.yaml)"
```

**调试技巧**

- 在本地开发时，您可以在控制台中看到日志输出
- 使用 `console.log()` 来调试您的代码
- 如果您对 KV 存储进行了更改，可能需要重启开发服务器

#### 部署到 Cloudflare Workers

**构建和部署**

当您准备好部署到生产环境时，运行以下命令：

```bash
npm run deploy:worker
```

这个命令会执行以下操作：
1. 首先构建项目（`npm run build:worker`）
2. 然后使用 Wrangler 将项目部署到 Cloudflare Workers

部署成功后，您将看到类似于以下的输出：

```
Published mcp-prompt-server (WORKER_ID)
  https://mcp-prompt-server.your-subdomain.workers.dev
```

**生产环境提示词管理**

部署后，您需要将提示词上传到生产环境的 KV 存储中。您可以使用 API 或者直接使用 Wrangler CLI：

```bash
# 使用 Wrangler 将提示词上传到生产环境 KV 存储
# 注意移除 --preview 标志

# 例如，上传一个提示词（假设提示词内容已保存在 prompt.yaml 文件中）
npx wrangler kv:key put --binding=PROMPTS_KV "prompts:example_prompt" "$(cat prompt.yaml)"
```

**自定义域名**

如果您想使用自定义域名而不是 Cloudflare 提供的默认域名，您可以在 Cloudflare Dashboard 中配置自定义域名：

1. 登录到 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择 "Workers & Pages" > 您的 Worker
3. 点击 "Triggers" 标签
4. 在 "Custom Domains" 部分中添加您的域名

#### 使用 HTTP API

**API 概述**

Cloudflare Workers 部署使用 HTTP API 而不是标准输入/输出。所有 API 请求和响应都使用 JSON 格式。以下是可用的 API 端点：

| 端点 | 方法 | 描述 |
|---------|------|------|
| `/health` | GET | 健康检查，用于验证服务是否正常运行 |
| `/api/get_prompt_names` | POST | 获取所有可用的提示词名称 |
| `/api/reload_prompts` | POST | 重新加载所有提示词 |
| `/api/add_new_prompt` | POST | 添加新的提示词 |
| `/api/update_prompt` | POST | 更新现有提示词 |
| `/api/delete_prompt` | POST | 删除提示词 |
| `/api/{prompt_name}` | POST | 处理特定提示词，其中 `{prompt_name}` 是提示词的名称 |

**请求和响应示例**

1. **健康检查**

   ```bash
   curl https://mcp-prompt-server.your-subdomain.workers.dev/health
   ```

   响应：
   ```json
   {
     "status": "ok",
     "version": "1.0.0"
   }
   ```

2. **获取提示词名称**

   ```bash
   curl -X POST https://mcp-prompt-server.your-subdomain.workers.dev/api/get_prompt_names
   ```

   响应：
   ```json
   {
     "promptNames": ["writing_assistant", "code_reviewer", "test_greeting"]
   }
   ```

3. **添加新提示词**

   ```bash
   curl -X POST https://mcp-prompt-server.your-subdomain.workers.dev/api/add_new_prompt \
     -H "Content-Type: application/json" \
     -d '{
       "name": "test_greeting",
       "description": "一个简单的问候提示词",
       "arguments": [
         { "name": "user_name", "description": "用户名" },
         { "name": "time_of_day", "description": "一天中的时间 (例如: 早上, 下午)" }
       ],
       "messages": [
         {
           "role": "user",
           "content": {
             "type": "text",
             "text": "{{time_of_day}}好，{{user_name}}！希望你今天过得愉快。"
           }
         }
       ]
     }'
   ```

   响应：
   ```json
   {
     "success": true,
     "message": "Prompt 'test_greeting' added successfully"
   }
   ```

4. **处理提示词**

   ```bash
   curl -X POST https://mcp-prompt-server.your-subdomain.workers.dev/api/test_greeting \
     -H "Content-Type: application/json" \
     -d '{
       "user_name": "张三",
       "time_of_day": "下午"
     }'
   ```

   响应：
   ```json
   {
     "result": "下午好，张三！希望你今天过得愉快。",
     "promptName": "test_greeting"
   }
   ```

**集成到其他应用**

您可以使用任何支持 HTTP 请求的编程语言或工具来集成 MCP Prompt Server API。以下是一个使用 JavaScript 的简单集成示例：

```javascript
async function processPrompt(promptName, args) {
  const response = await fetch(`https://mcp-prompt-server.your-subdomain.workers.dev/api/${promptName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  
  return await response.json();
}

// 使用示例
processPrompt('test_greeting', { user_name: '李四', time_of_day: '早上' })
  .then(result => console.log(result))
  .catch(error => console.error('Error:', error));
```

**安全性考虑**

在生产环境中，您可能需要为 API 添加身份验证和授权机制。这可以通过以下方式实现：

1. 使用 API 密钥：在请求头中添加授权令牌
2. 使用 Cloudflare Access 或类似的服务来保护您的 API
3. 实现 IP 白名单或其他访问控制机制
```

## Prompts (提示)

提示定义了 LLM 的任务和指令。它们作为单独的 YAML 文件存储在 `src/prompts/` 目录中。

### Prompt 结构

每个提示文件以 YAML 格式定义以下字段：

*   `name` (字符串, 必填): 提示的唯一标识符。此名称也用于生成的 MCP 工具。
*   `description` (字符串, 可选): 对提示功能的易读描述。
*   `arguments` (对象数组, 可选): 定义提示期望的输入参数。每个参数对象具有：
    *   `name` (字符串, 必填): 参数的名称。
    *   `description` (字符串, 可选): 参数的描述。
*   `messages` (对象数组, 必填): 定义对话结构。每个消息对象具有：
    *   `role` (字符串, 必填): 发言者的角色 (例如, "user", "assistant", "system")。
    *   `content` (对象, 必填): 消息的内容。对于基于文本的提示，这通常是：
        *   `type`: "text"
        *   `text`: 消息字符串，可以包含 `{{argument_name}}` 格式的占位符用于参数替换。

**示例 (`example_prompt.yaml`):**
```yaml
name: example_greeting
description: 使用自定义消息问候用户。
arguments:
  - name: user_name
    description: 要问候的用户的名字。
  - name: time_of_day
    description: 一天中的时间 (例如, morning, afternoon)。
messages:
  - role: user
    content:
      type: text
      text: "Good {{time_of_day}}, {{user_name}}! I hope you are having a wonderful day."
```
*(注意：YAML 中的内容，如 `description` 和 `text` 字段中的英文示例，通常保持原文，除非特定要求翻译它们以用于纯中文环境下的模板。此处保持英文以确保模板的直接可用性。)*

### 默认 Prompts

服务器在 `src/prompts/` 目录中附带了多种预定义的提示，包括：
*   `writing_assistant.yaml` (写作助手)
*   `code_refactoring.yaml` (代码重构)
*   `test_case_generator.yaml` (测试用例生成器)
*   `api_documentation.yaml` (API 文档)
*   *(以及许多其他...)*

## 可用的 MCP 工具

服务器运行后，提供以下几种 MCP 工具：

1.  **Prompt 工具:** 从 `src/prompts/` 目录加载的每个提示都会成为一个可调用的工具，以提示的 `name` 命名。
    *   **输入:** 一个对象，其键是在提示的 `arguments` 部分中定义的参数名称。
    *   **输出:** 替换所提供参数后处理过的提示文本。

2.  **管理工具:**
    *   **`get_prompt_names`**
        *   **描述:** 检索所有当前加载和可用的提示名称列表。
        *   **输入:** 无。
        *   **输出:** 提示名称列表。

    *   **`reload_prompts`**
        *   **描述:** 从 `src/prompts/` 目录重新加载所有 YAML 提示定义文件。如果您在服务器运行时手动添加、删除或修改了提示文件，此功能非常有用。
        *   **输入:** 无。
        *   **输出:** 一条消息，指示成功重新加载的提示数量。

    *   **`add_new_prompt`**
        *   **描述:** 动态向服务器添加新提示，并使其作为工具可用，无需手动创建文件和重新启动服务器。
        *   **输入模式:** 具有以下属性的对象：
            *   `name` (字符串, 必填): 新提示的唯一名称。这也将作为文件名 (例如, "my_prompt" 变为 "my_prompt.yaml") 和 MCP 工具名称。
            *   `description` (字符串, 可选): 提示的描述。
            *   `arguments` (对象数组, 可选): 每个对象定义一个参数，包含 `name` (字符串, 必填) 和 `description` (字符串, 可选)。
            *   `messages` (对象数组, 必填): 每个对象定义一条消息，包含 `role` (字符串, 必填: "user", "assistant", 或 "system") 和 `content` (对象, 必填: `{ type: "text", text: "..." }`)。
        *   **`add_new_prompt` 的输入示例:**
            ```yaml
            name: custom_task_explainer
            description: 根据提供的细节解释自定义任务。
            arguments:
              - name: task_name
                description: 任务名称
              - name: task_details
                description: 关于任务的具体细节
            messages:
              - role: user
                content:
                  type: text
                  text: 请解释任务 '{{task_name}}'。以下是细节: {{task_details}}
              - role: assistant
                content:
                  type: text
                  text: 好的，我将解释 {{task_name}}。
            ```
        *   **输出:** 一条成功消息，指示提示已添加并加载；如果失败，则返回错误消息。
        *   **使用方法:**
            1. 准备好您的提示词定义，包括名称、描述、参数和消息。
            2. 调用 `add_new_prompt` 工具，传入您的提示词定义。
            3. 服务器会自动创建一个新的 YAML 文件，保存到 `src/prompts` 目录。
            4. 服务器会自动重新加载所有提示词，使新添加的提示词立即可用。
            5. 您可以立即使用新添加的提示词，无需重启服务器。
        *   **注意事项:**
            * 提示词名称必须是唯一的，如果已存在同名提示词，添加操作将失败。
            * 提示词文件将以 YAML 格式保存，与项目中的其他提示词保持一致的格式。
            * 添加提示词后，您可以使用 `get_prompt_names` 工具验证新提示词是否已成功加载。
            * 如果需要修改已存在的提示词，请使用 `update_prompt` 工具而不是 `add_new_prompt`。

## 贡献

欢迎贡献！请随时在项目的仓库中开启一个 issue 来讨论错误或建议功能，或提交包含您改进的 pull request。
