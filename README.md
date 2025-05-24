# MCP Prompt Server

## Overview

The MCP Prompt Server is a pure MCP tool that provides a collection of Large Language Model (LLM) prompts as callable tools. It allows for dynamic loading of prompts from YAML files and provides tools for managing and interacting with these prompts. This tool is designed to guide AI models like Claude in performing specific tasks by providing them with structured prompts.

## Features

* **Dynamic Prompt Loading:** Loads prompt definitions from YAML files located in the `src/prompts` directory.
* **MCP Tool Integration:** Provides a set of MCP tools for managing prompts.
* **Core Management Tools:**
    * `get_prompt_names`: Lists all currently available prompt names.
    * `get_prompt_details`: Retrieves detailed information about a specific prompt.
    * `reload_prompts`: Reloads all prompt files from the disk, updating the available tools.
* **Prompt Template Support:**
    * `get_prompt_template`: Provides a YAML template for creating new prompts.
    * `create_prompt`: Creates new prompts from YAML content and saves them to disk.
* **TypeScript-Based:** Written in TypeScript for enhanced robustness and maintainability.

## Project Structure

```
mcp-prompt-server/
├── src/
│   ├── index.ts         # Main MCP tool implementation
│   ├── types.ts         # TypeScript type definitions
│   ├── prompts/         # Directory containing prompt definition files (YAML)
│   └── templates/       # Directory containing templates for new prompts
├── mcp_config.json      # MCP configuration file
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


## Configuration

The MCP Prompt Server is configured through the MCP configuration file (`mcp_config.json`). The main configuration is the path to the tool command:

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

The prompt server will automatically load prompts from the `src/prompts` directory when it starts.

## Development

For development, you can use the following commands:

```bash
# Build the TypeScript code
npm run build

# Run the tool directly
npm start
```

After the tool starts, you'll see output similar to:

```
加载提示词目录: /path/to/mcp-prompt-server/src/prompts
已加载 X 个提示词
MCP Prompt Server 工具已加载
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
