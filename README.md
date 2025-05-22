# MCP Prompt Server

## Overview

The MCP Prompt Server is a Node.js application that leverages the Model Context Protocol (MCP) to expose a collection of Large Language Model (LLM) prompts as callable tools. It allows for dynamic loading of prompts from local files and provides tools for managing and interacting with these prompts. This server is designed to guide AI models like Claude in performing specific tasks by providing them with structured prompts.

## Features

*   **Dynamic Prompt Loading:** Loads prompt definitions from YAML or JSON files located in the `src/prompts` directory.
*   **MCP Tool Exposure:** Each loaded prompt is automatically exposed as an individual MCP tool.
*   **Management Tools:**
    *   `get_prompt_names`: Lists all currently available prompt tools.
    *   `reload_prompts`: Reloads all prompt files from the disk, updating the available tools.
*   **Dynamic Prompt Creation:**
    *   `add_new_prompt`: A tool that allows for adding new prompts to the server dynamically without manual file creation and restart.
*   **TypeScript Based:** Written in TypeScript for robustness and maintainability.

## Project Structure

```
mcp-prompt-server/
├── src/
│   ├── index.ts         # Main server logic and tool definitions
│   └── prompts/         # Directory containing prompt definition files (YAML/JSON)
├── dist/                # Compiled JavaScript files (after build)
├── package.json         # Project metadata and dependencies
├── tsconfig.json        # TypeScript compiler options
└── README.md            # This file
```

## Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or later recommended)
*   [npm](https://www.npmjs.com/) (Node Package Manager) or [pnpm](https://pnpm.io/)

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository_url>
    cd mcp-prompt-server
    ```
2.  Install dependencies:
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
npm start
```
This command will first build the project (if not already built) and then run the server using `node dist/index.js`. The server will listen for MCP connections via standard input/output (stdio).

For development, you might also see a `dev` script using `nodemon` (e.g., `npm run dev`), but `npm start` is the standard way to run the production-ready server.

## Prompts

Prompts define the tasks and instructions for the LLM. They are stored as individual YAML or JSON files in the `src/prompts/` directory.

### Prompt Structure

Each prompt file defines the following fields:

*   `name` (string, required): A unique identifier for the prompt. This name is also used for the generated MCP tool.
*   `description` (string, optional): A human-readable description of what the prompt does.
*   `arguments` (array of objects, optional): Defines the input arguments the prompt expects. Each argument object has:
    *   `name` (string, required): The name of the argument.
    *   `description` (string, optional): A description of the argument.
*   `messages` (array of objects, required): Defines the conversation structure. Each message object has:
    *   `role` (string, required): The role of the speaker (e.g., "user", "assistant", "system").
    *   `content` (object, required): The content of the message. For text-based prompts, this is typically:
        *   `type`: "text"
        *   `text`: The message string, which can include `{{argument_name}}` placeholders for argument substitution.

**Example (`example_prompt.yaml`):**

```yaml
name: example_greeting
description: Greets a user with a custom message.
arguments:
  - name: user_name
    description: The name of the user to greet.
  - name: time_of_day
    description: The time of day (e.g., morning, afternoon).
messages:
  - role: user
    content:
      type: text
      text: "Good {{time_of_day}}, {{user_name}}! I hope you are having a wonderful day."
```

### Default Prompts

The server comes with a variety of pre-defined prompts in `src/prompts/`, including:
*   `writing_assistant.yaml`
*   `code_refactoring.yaml`
*   `test_case_generator.yaml`
*   `api_documentation.yaml`
*   *(And many others...)*

## Available MCP Tools

Once the server is running, it provides several MCP tools:

1.  **Prompt Tools:** Each prompt loaded from the `src/prompts/` directory becomes a callable tool, named after the prompt's `name`.
    *   **Input:** An object where keys are argument names defined in the prompt's `arguments` section.
    *   **Output:** The processed prompt text after substituting the provided arguments.

2.  **Management Tools:**
    *   **`get_prompt_names`**
        *   **Description:** Retrieves a list of all currently loaded and available prompt names.
        *   **Input:** None.
        *   **Output:** A list of prompt names.

    *   **`reload_prompts`**
        *   **Description:** Reloads all prompt definition files from the `src/prompts/` directory. This is useful if you've manually added, removed, or modified prompt files while the server is running.
        *   **Input:** None.
        *   **Output:** A message indicating the number of prompts successfully reloaded.

    *   **`add_new_prompt`**
        *   **Description:** Dynamically adds a new prompt to the server and makes it available as a tool without needing a manual file creation and server restart.
        *   **Input Schema:** An object with the following properties:
            *   `name` (string, required): The unique name for the new prompt. This will also be the filename (e.g., "my_prompt" becomes "my_prompt.json") and the MCP tool name.
            *   `description` (string, optional): A description for the prompt.
            *   `arguments` (array of objects, optional): Each object defining an argument with `name` (string, required) and `description` (string, optional).
            *   `messages` (array of objects, required): Each object defining a message with `role` (string, required: "user", "assistant", or "system") and `content` (object, required: `{ type: "text", text: "..." }`).
        *   **Example Input for `add_new_prompt`:**
            ```json
            {
              "name": "custom_task_explainer",
              "description": "Explains a custom task based on provided details.",
              "arguments": [
                { "name": "task_name", "description": "Name of the task" },
                { "name": "task_details", "description": "Specific details about the task" }
              ],
              "messages": [
                {
                  "role": "user",
                  "content": {
                    "type": "text",
                    "text": "Please explain the task '{{task_name}}'. Here are the details: {{task_details}}"
                  }
                },
                {
                  "role": "assistant",
                  "content": {
                    "type": "text",
                    "text": "Okay, I will explain {{task_name}}."
                  }
                }
              ]
            }
            ```
        *   **Output:** A success message indicating the prompt has been added and loaded, or an error message if it fails.

## Contributing

Contributions are welcome! Please feel free to open an issue on the project's repository to discuss bugs or suggest features, or submit a pull request with your improvements.
