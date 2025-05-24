# MCP 提示词服务器

## 概述

MCP 提示词服务器是一个纯 MCP 工具，提供一系列大型语言模型 (LLM) 提示词作为可调用工具。它允许从 YAML 文件动态加载提示词，并提供用于管理和交互这些提示词的工具。该工具旨在通过提供结构化提示词来引导 Claude 等 AI 模型执行特定任务。

## 特性

* **动态提示词加载：** 从位于 `src/prompts` 目录中的 YAML 文件加载提示词定义。
* **MCP 工具集成：** 提供一套用于管理提示词的 MCP 工具。
* **核心管理工具：**
    * `get_prompt_names`：列出所有当前可用的提示词名称。
    * `get_prompt_details`：获取特定提示词的详细信息。
    * `reload_prompts`：从磁盘重新加载所有提示词文件，更新可用的工具。
* **提示词模板支持：**
    * `get_prompt_template`：提供用于创建新提示词的 YAML 模板。
    * `create_prompt`：从 YAML 内容创建新提示词并保存到磁盘。
* **基于 TypeScript：** 使用 TypeScript 编写，以增强健壮性和可维护性。

## 项目结构

```
mcp-prompt-server/
├── src/
│   ├── index.ts         # 主要 MCP 工具实现
│   ├── types.ts         # TypeScript 类型定义
│   ├── prompts/         # 包含提示词定义文件的目录 (YAML)
│   └── templates/       # 包含新提示词模板的目录
├── mcp_config.json      # MCP 配置文件
├── package.json         # 项目元数据和依赖项
├── tsconfig.json        # TypeScript 编译器选项
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

## 构建项目

项目使用 TypeScript 编写，需要编译为 JavaScript：

```bash
npm run build
```

此命令使用 `tsc`（TypeScript 编译器）将 `src/` 中的文件编译到 `dist/` 目录，如 `tsconfig.json` 中配置的那样。

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

对于开发目的，您也可以直接运行工具：

```bash
npm start
```

## 配置

MCP 提示词服务器通过 MCP 配置文件（`mcp_config.json`）进行配置。主要配置是工具命令的路径：

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

提示词服务器在启动时会自动从 `src/prompts` 目录加载提示词。

## 开发

对于开发，您可以使用以下命令：

```bash
# 构建 TypeScript 代码
npm run build

# 直接运行工具
npm start
```

工具启动后，您将看到类似于以下的输出：

```
加载提示词目录: /path/to/mcp-prompt-server/src/prompts
已加载 X 个提示词
MCP Prompt Server 工具已加载
可用工具: get_prompt_names, get_prompt_details, reload_prompts, get_prompt_template, create_prompt
```

**调试技巧**

- 在开发过程中，您可以在控制台中看到日志输出
- 使用 `console.log()` 来调试您的代码
- 当您调用 `reload_prompts` 函数时，工具将自动重新加载提示词

## MCP 工具参考

MCP 提示词服务器通过 MCP 协议提供以下工具：

### 可用工具

| 工具名称 | 描述 |
|---------|------|
| `get_prompt_names` | 获取所有可用的提示词名称 |
| `get_prompt_details` | 获取特定提示词的详细信息 |
| `reload_prompts` | 从目录重新加载所有提示词 |
| `get_prompt_template` | 获取用于创建新提示词的 YAML 模板 |
| `create_prompt` | 从 YAML 内容创建新提示词 |

### 工具使用示例

1. **获取提示词名称**

   ```javascript
   // 通过 MCP 框架
   const result = await mcpClient.callTool('prompt-server', 'get_prompt_names');
   console.log(result.data); // 提示词名称数组
   ```

2. **获取提示词详情**

   ```javascript
   // 通过 MCP 框架
   const result = await mcpClient.callTool('prompt-server', 'get_prompt_details', {
     name: 'code_assistant'
   });
   console.log(result.data); // 提示词详情
   ```

3. **重新加载提示词**

   ```javascript
   // 通过 MCP 框架
   const result = await mcpClient.callTool('prompt-server', 'reload_prompts');
   console.log(result.message); // 确认消息
   ```

4. **获取提示词模板**

   ```javascript
   // 通过 MCP 框架
   const result = await mcpClient.callTool('prompt-server', 'get_prompt_template');
   console.log(result.data); // 用于创建提示词的 YAML 模板
   ```

5. **创建提示词**

   ```javascript
   // 通过 MCP 框架
   const yamlContent = `
   name: greeting_prompt
   description: 一个简单的问候提示词
   category: 示例
   tags:
     - 问候
     - 示例
   arguments:
     - name: user_name
       description: 用户名
       required: true
     - name: time_of_day
       description: 一天中的时间（早上、下午、晚上）
       required: false
   messages:
     - role: user
       content:
         type: text
         text: |
           {{time_of_day}}好，{{user_name}}！希望你今天过得愉快。
   `;
   
   const result = await mcpClient.callTool('prompt-server', 'create_prompt', {
     name: 'greeting_prompt',
     content: yamlContent
   });
   console.log(result.message); // 确认消息
   ```

## 与 AI 助手集成

MCP 提示词服务器的一个关键特性是能够与 Claude 等 AI 助手合作创建和管理提示词。以下是一个典型的工作流程：

1. **获取提示词模板**，使用 `get_prompt_template` 工具
2. **请求 AI** 根据您的需求填充模板
3. **创建提示词**，使用 `create_prompt` 工具和 AI 生成的内容

这允许一个协作过程，AI 帮助设计有效的提示词，然后可以保存和重用。

## 提示词

### 提示词结构

MCP 提示词服务器中的提示词以 YAML 格式定义，并存储在 `src/prompts` 目录中。每个提示词文件包含以下字段：

* `name`（字符串，必需）：提示词的唯一标识符。
* `description`（字符串，可选）：提示词功能的描述。
* `category`（字符串，可选）：提示词所属的类别。
* `tags`（字符串数组，可选）：与提示词关联的标签。
* `arguments`（对象数组，可选）：可以传递给提示词的参数。每个参数对象包含：
  * `name`（字符串，必需）：参数名称。
  * `description`（字符串，可选）：参数描述。
  * `required`（布尔值，可选）：参数是否必需。
* `messages`（对象数组，必需）：定义对话结构。每个消息对象包含：
  * `role`（字符串，必需）：发言者的角色（例如，"system"、"user"、"assistant"）。
  * `content`（对象，必需）：消息内容，通常包含：
    * `type`："text"
    * `text`：消息文本，可以包含参数占位符，如 `{{parameter_name}}`。

**示例：**

```yaml
name: greeting_prompt
description: 一个简单的问候提示词
category: 示例
tags:
  - 问候
  - 示例
arguments:
  - name: user_name
    description: 用户名
    required: true
  - name: time_of_day
    description: 一天中的时间（早上、下午、晚上）
    required: false
messages:
  - role: user
    content:
      type: text
      text: |
        {{time_of_day}}好，{{user_name}}！希望你今天过得愉快。
```

### 默认提示词

MCP 提示词服务器在 `src/prompts` 目录中附带了几个默认提示词，包括：

* `general_assistant`：用于日常对话的通用助手提示词
* `code_assistant`：用于编程相关问题的代码助手提示词
* `writing_assistant`：用于内容创作的写作助手提示词
* `api_documentation`：用于生成 API 文档的提示词

## 贡献

欢迎贡献！请随时在项目的仓库中开启一个 issue 来讨论错误或建议功能，或提交包含您改进的 pull request。