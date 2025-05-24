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
* **Multiple Deployment Options:** Supports both traditional deployment using standard input/output and Cloudflare Workers deployment using HTTP API.

## Project Structure

```
mcp-prompt-server/
├── src/
│   ├── index.ts         # Main server logic and tool definitions
│   ├── api/             # HTTP API implementation for Cloudflare Workers
│   ├── core/            # Core prompt service logic
│   ├── storage/         # Storage interface implementations
│   └── prompts/         # Directory containing prompt definition files (YAML)
├── dist/                # Compiled JavaScript files (after build)
├── package.json         # Project metadata and dependencies
├── tsconfig.json        # TypeScript compiler options
├── tsconfig.workers.json # TypeScript compiler options for Cloudflare Workers
├── wrangler.toml        # Cloudflare Workers configuration
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

### Traditional Deployment (Standard Input/Output)

To start the MCP Prompt Server:

```bash
npm start
```

This command will first build the project (if not already built) and then run the server using `node dist/index.js`. The server will listen for MCP connections via standard input/output (stdio).

For development, you might also see a `dev` script using `nodemon` (e.g., `npm run dev`), but `npm start` is the standard way to run the production-ready server.

### Cloudflare Workers Deployment (HTTP API)

This project supports deployment to Cloudflare Workers, allowing you to leverage Cloudflare's global distributed network to run your MCP Prompt Server without managing server infrastructure. The Cloudflare Workers deployment uses HTTP API instead of standard input/output communication and uses Cloudflare KV as storage backend.

**Key Benefits:**

- **Global Distributed Deployment**: Leverage Cloudflare's global edge network for low-latency access
- **No Server Management**: No need to maintain servers, operating systems, or other infrastructure
- **Automatic Scaling**: Scales automatically based on traffic, no manual intervention required
- **Persistent Storage**: Uses Cloudflare KV for storing prompts, no file system access needed

#### Prerequisites for Cloudflare Workers Deployment

1. A Cloudflare account
2. Wrangler CLI installed: `npm install -g wrangler`
3. Authenticate with Cloudflare: `wrangler login`

#### Setting Up Cloudflare KV Namespace

Create a KV namespace to store your prompts:

```bash
wrangler kv:namespace create PROMPTS_KV
```

This will output a namespace ID. Update the `wrangler.toml` file with this ID:

```toml
[[kv_namespaces]]
binding = "PROMPTS_KV"
id = "your-kv-namespace-id-here" # Replace with the ID from the command output
```

For local development, create a preview namespace:

```bash
wrangler kv:namespace create PROMPTS_KV --preview
```

Update the `wrangler.toml` file with the preview ID as well:

```toml
[[kv_namespaces]]
binding = "PROMPTS_KV"
id = "your-kv-namespace-id-here"
preview_id = "your-preview-kv-namespace-id-here" # Replace with the preview ID
```

#### Building and Deploying to Cloudflare Workers

Build the project for Cloudflare Workers:

```bash
npm run build:worker
```

Run locally for development:

```bash
npm run dev:worker
```

Deploy to Cloudflare Workers:

```bash
npm run deploy:worker
```

#### Using the HTTP API

Once deployed, you can interact with your MCP Prompt Server via HTTP requests:

```bash
curl -X POST https://your-worker-subdomain.workers.dev/ \
  -H "Content-Type: application/json" \
  -d '{"type":"request","id":"1","tool":"get_prompt_names","args":{}}'
```

This will return a JSON response with the available prompt names.
- **HTTP API Interface**: Provides standard HTTP API for easy integration with other services

#### Prerequisites

1. **Register and Configure a Cloudflare Account**
   - Register a [Cloudflare](https://dash.cloudflare.com/sign-up) account (if you don't have one)
   - Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com)
   - In the sidebar, click on "Workers & Pages" to ensure your account has Workers enabled

2. **Install Project Dependencies**
   ```bash
   npm install
   ```
   This will install all required dependencies, including the Wrangler CLI.

3. **Log in to Wrangler**
   ```bash
   npx wrangler login
   ```
   This will open a browser and guide you through the authentication process for your Cloudflare account.

#### Creating KV Namespaces

**What is Cloudflare KV?**

Cloudflare KV (Key-Value) is a globally distributed key-value storage system used for storing data in Cloudflare Workers. In our project, KV storage is used as a replacement for the file system to store all prompt definitions.

**Create Production Environment KV Namespace**

Run the following command to create a KV namespace for the production environment:

```bash
npx wrangler kv:namespace create PROMPTS_KV
```

After running, you'll see output similar to:

```
✅ Created namespace "PROMPTS_KV" with ID "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Update Configuration File**

Copy the ID from the output and edit the `wrangler.toml` file, replacing `your-kv-namespace-id-here` with the actual ID:

```toml
[[kv_namespaces]]
binding = "PROMPTS_KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" # Replace with your actual ID
```

**Create Development Environment KV Namespace**

Similarly, create a preview KV namespace for local development:

```bash
npx wrangler kv:namespace create PROMPTS_KV --preview
```

And replace the ID in the `wrangler.toml` file for `your-preview-kv-namespace-id-here`:

```toml
[[kv_namespaces]]
binding = "PROMPTS_KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" # Production environment ID
preview_id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy" # Development environment ID
```

**Why Two KV Namespaces?**

- **Production Environment ID**: Used for actual deployment to Cloudflare Workers production environment
- **Preview ID**: Used for local development and testing, doesn't affect production data

#### Local Development

**Build and Run Local Development Server**

Run the following command to develop and test the Cloudflare Workers version locally:

```bash
npm run dev:worker
```

This command will:
1. First build the project (`npm run build:worker`)
2. Then start a local development server using Wrangler

After the server starts, you'll see output similar to:

```
[wrangler] Ready on http://localhost:8787
```

You can now access http://localhost:8787 in your browser to test your API.

**Managing Prompts During Development**

During development, you may need to upload prompts to the KV storage. You can use the API or directly use the Wrangler CLI:

```bash
# Using Wrangler to upload prompts to KV storage
# Format: npx wrangler kv:key put --binding=PROMPTS_KV --preview "key" "value"

# For example, uploading a prompt (assuming the prompt content is saved in a prompt.yaml file)
npx wrangler kv:key put --binding=PROMPTS_KV --preview "prompts:example_prompt" "$(cat prompt.yaml)"
```

**Debugging Tips**

- During local development, you can see log output in the console
- Use `console.log()` to debug your code
- If you make changes to the KV storage, you may need to restart the development server

#### Deploying to Cloudflare Workers

**Build and Deploy**

When you're ready to deploy to the production environment, run:

```bash
npm run deploy:worker
```

This command will:
1. First build the project (`npm run build:worker`)
2. Then deploy the project to Cloudflare Workers using Wrangler

After successful deployment, you'll see output similar to:

```
Published mcp-prompt-server (WORKER_ID)
  https://mcp-prompt-server.your-subdomain.workers.dev
```

**Managing Prompts in Production**

After deployment, you need to upload prompts to the production environment's KV storage. You can use the API or directly use the Wrangler CLI:

```bash
# Using Wrangler to upload prompts to production KV storage
# Note the removal of the --preview flag

# For example, uploading a prompt (assuming the prompt content is saved in a prompt.yaml file)
npx wrangler kv:key put --binding=PROMPTS_KV "prompts:example_prompt" "$(cat prompt.yaml)"
```

**Custom Domain**

If you want to use a custom domain instead of the default domain provided by Cloudflare, you can configure it in the Cloudflare Dashboard:

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select "Workers & Pages" > Your Worker
3. Click on the "Triggers" tab
4. Add your domain in the "Custom Domains" section

#### Using the HTTP API

**API Overview**

The Cloudflare Workers deployment uses HTTP API instead of standard input/output. All API requests and responses use JSON format. Here are the available API endpoints:

| Endpoint | Method | Description |
|---------|------|------|
| `/health` | GET | Health check to verify the service is running properly |
| `/api/get_prompt_names` | POST | Get all available prompt names |
| `/api/reload_prompts` | POST | Reload all prompts |
| `/api/add_new_prompt` | POST | Add a new prompt |
| `/api/update_prompt` | POST | Update an existing prompt |
| `/api/delete_prompt` | POST | Delete a prompt |
| `/api/{prompt_name}` | POST | Process a specific prompt, where `{prompt_name}` is the name of the prompt |

**Request and Response Examples**

1. **Health Check**

   ```bash
   curl https://mcp-prompt-server.your-subdomain.workers.dev/health
   ```

   Response:
   ```json
   {
     "status": "ok",
     "version": "1.0.0"
   }
   ```

2. **Get Prompt Names**

   ```bash
   curl -X POST https://mcp-prompt-server.your-subdomain.workers.dev/api/get_prompt_names
   ```

   Response:
   ```json
   {
     "promptNames": ["writing_assistant", "code_reviewer", "test_greeting"]
   }
   ```

3. **Add New Prompt**

   ```bash
   curl -X POST https://mcp-prompt-server.your-subdomain.workers.dev/api/add_new_prompt \
     -H "Content-Type: application/json" \
     -d '{
       "name": "test_greeting",
       "description": "A simple greeting prompt",
       "arguments": [
         { "name": "user_name", "description": "Username" },
         { "name": "time_of_day", "description": "Time of day (e.g., morning, afternoon)" }
       ],
       "messages": [
         {
           "role": "user",
           "content": {
             "type": "text",
             "text": "Good {{time_of_day}}, {{user_name}}! Hope you're having a great day."
           }
         }
       ]
     }'
   ```

   Response:
   ```json
   {
     "success": true,
     "message": "Prompt 'test_greeting' added successfully"
   }
   ```

4. **Process Prompt**

   ```bash
   curl -X POST https://mcp-prompt-server.your-subdomain.workers.dev/api/test_greeting \
     -H "Content-Type: application/json" \
     -d '{
       "user_name": "John",
       "time_of_day": "afternoon"
     }'
   ```

   Response:
   ```json
   {
     "result": "Good afternoon, John! Hope you're having a great day.",
     "promptName": "test_greeting"
   }
   ```

**Integration with Other Applications**

You can integrate the MCP Prompt Server API with any programming language or tool that supports HTTP requests. Here's a simple integration example using JavaScript:

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

// Usage example
processPrompt('test_greeting', { user_name: 'Jane', time_of_day: 'morning' })
  .then(result => console.log(result))
  .catch(error => console.error('Error:', error));
```

**Security Considerations**

In a production environment, you may want to add authentication and authorization mechanisms to your API. This can be achieved through:

1. Using API keys: Add authorization tokens in request headers
2. Using Cloudflare Access or similar services to protect your API
3. Implementing IP whitelisting or other access control mechanisms

## Prompts

Prompts define the tasks and instructions for the LLM. They are stored as individual YAML files in the `src/prompts/` directory.

### Prompt Structure

Each prompt file defines the following fields:

* `name` (string, required): A unique identifier for the prompt. This name is also used for the generated MCP tool.
* `description` (string, optional): A human-readable description of what the prompt does.
* `arguments` (array of objects, optional): Defines the input arguments the prompt expects. Each argument object has:
  * `name` (string, required): The name of the argument.
  * `description` (string, optional): A description of the argument.
* `messages` (array of objects, required): Defines the conversation structure. Each message object has:
  * `role` (string, required): The role of the speaker (e.g., "user", "assistant", "system").
  * `content` (object, required): The content of the message. For text-based prompts, this is typically:
    * `type`: "text"
    * `text`: The message string, which can include `{{argument_name}}` placeholders for argument substitution.

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
* `writing_assistant.yaml`
* `code_refactoring.yaml`
* `test_case_generator.yaml`
* `api_documentation.yaml`
* *(And many others...)*

## Available MCP Tools

Once the server is running, it provides several MCP tools:

1. **Prompt Tools:** Each prompt loaded from the `src/prompts/` directory becomes a callable tool, named after the prompt's `name`.
   * **Input:** An object where keys are argument names defined in the prompt's `arguments` section.
   * **Output:** The processed prompt text after substituting the provided arguments.

2. **Management Tools:**
   * **`get_prompt_names`**
     * **Description:** Retrieves a list of all currently loaded and available prompt names.
     * **Input:** None.
     * **Output:** A list of prompt names.

   * **`reload_prompts`**
     * **Description:** Reloads all prompt definition files from the `src/prompts/` directory. This is useful if you've manually added, removed, or modified prompt files while the server is running.
     * **Input:** None.
     * **Output:** A message indicating the number of prompts successfully reloaded.

   * **`add_new_prompt`**
     * **Description:** Dynamically adds a new prompt to the server and makes it available as a tool without needing a manual file creation and server restart.
     * **Input Schema:** An object with the following properties:
       * `name` (string, required): The unique name for the new prompt. This will also be the filename (e.g., "my_prompt" becomes "my_prompt.yaml") and the MCP tool name.
       * `description` (string, optional): A description for the prompt.
       * `arguments` (array of objects, optional): Each object defining an argument with `name` (string, required) and `description` (string, optional).
       * `messages` (array of objects, required): Each object defining a message with `role` (string, required: "user", "assistant", or "system") and `content` (object, required: `{ type: "text", text: "..." }`).
     * **Example Input for `add_new_prompt`:**
       ```yaml
       name: custom_task_explainer
       description: Explains a custom task based on provided details.
       arguments:
         - name: task_name
           description: Name of the task
         - name: task_details
           description: Specific details about the task
       messages:
         - role: user
           content:
             type: text
             text: Please explain the task '{{task_name}}'. Here are the details: {{task_details}}
         - role: assistant
           content:
             type: text
             text: Okay, I will explain {{task_name}}.
       ```
     * **Output:** A success message indicating the prompt has been added and loaded, or an error message if it fails.
     * **Usage:**
       1. Prepare your prompt definition, including name, description, arguments, and messages.
       2. Call the `add_new_prompt` tool, passing in your prompt definition.
       3. The server will automatically create a new YAML file, saving it to the `src/prompts` directory.
       4. The server will automatically reload all prompts, making the newly added prompt immediately available.
       5. You can immediately use the newly added prompt without restarting the server.
     * **Notes:**
       * The prompt name must be unique; if a prompt with the same name already exists, the add operation will fail.
       * The prompt file will be saved in YAML format, consistent with the format of other prompts in the project.
       * After adding a prompt, you can use the `get_prompt_names` tool to verify that the new prompt has been successfully loaded.
       * If you need to modify an existing prompt, use the `update_prompt` tool instead of `add_new_prompt`.

## Contributing

Contributions are welcome! Please feel free to open an issue on the project's repository to discuss bugs or suggest features, or submit a pull request with your improvements.
