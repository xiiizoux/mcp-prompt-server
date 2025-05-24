# MCP Prompt 服务器

## 概述

MCP Prompt 服务器是一个 Node.js 应用程序，它利用模型上下文协议 (MCP) 将一系列大型语言模型 (LLM) 提示作为可调用工具公开。它允许从本地文件动态加载提示，并提供用于管理这些提示并与之交互的工具。此服务器旨在通过为 AI 模型（如 Claude）提供结构化提示来指导它们执行特定任务。

## 特性

*   **动态提示加载：** 从位于 `src/prompts` 目录中的 YAML 或 JSON 文件加载提示定义。
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
│   ├── index.ts         # 主要服务器逻辑和工具定义
│   └── prompts/         # 包含提示定义文件 (YAML/JSON) 的目录
├── dist/                # 编译后的 JavaScript 文件 (构建后)
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
    # 或
    # pnpm install
    ```

## 构建项目

项目使用 TypeScript 编写，需要编译成 JavaScript：

```bash
npm run build
```
此命令使用 `tsc` (TypeScript 编译器) 将 `src/` 目录下的文件编译到 `dist/` 目录，具体配置在 `tsconfig.json` 中。

## 运行服务器

启动 MCP Prompt 服务器：

```bash
npm start
```
此命令会首先构建项目（如果尚未构建），然后使用 `node dist/index.js` 运行服务器。服务器将通过标准输入/输出 (stdio) 监听 MCP 连接。

对于开发，您可能还会看到一个使用 `nodemon` 的 `dev` 脚本 (例如 `npm run dev`)，但 `npm start` 是运行生产就绪服务器的标准方式。

## Prompts (提示)

提示定义了 LLM 的任务和指令。它们作为单独的 YAML 或 JSON 文件存储在 `src/prompts/` 目录中。

### Prompt 结构

每个提示文件定义以下字段：

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
*(注意：YAML/JSON 中的内容，如 `description` 和 `text` 字段中的英文示例，通常保持原文，除非特定要求翻译它们以用于纯中文环境下的模板。此处保持英文以确保模板的直接可用性。)*

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
        *   **描述:** 从 `src/prompts/` 目录重新加载所有提示定义文件。如果您在服务器运行时手动添加、删除或修改了提示文件，此功能非常有用。
        *   **输入:** 无。
        *   **输出:** 一条消息，指示成功重新加载的提示数量。

    *   **`add_new_prompt`**
        *   **描述:** 动态向服务器添加新提示，并使其作为工具可用，无需手动创建文件和重新启动服务器。
        *   **输入模式:** 具有以下属性的对象：
            *   `name` (字符串, 必填): 新提示的唯一名称。这也将作为文件名 (例如, "my_prompt" 变为 "my_prompt.json") 和 MCP 工具名称。
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
