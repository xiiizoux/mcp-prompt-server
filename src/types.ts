/**
 * 类型定义文件
 */

// 提示词参数定义
export interface PromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

// 提示词消息内容
export interface PromptMessageContent {
  type: string; // 通常为 'text'
  text?: string;
  // 可能有其他字段
}

// 提示词消息
export interface PromptMessage {
  role: 'user' | 'assistant' | 'system';
  content: PromptMessageContent | { text: string };
}

// 提示词标签类型
export type PromptTag = string;

// 提示词类别
export enum PromptCategory {
  WRITING = 'writing',
  CODING = 'coding',
  ANALYSIS = 'analysis',
  CONVERSATION = 'conversation',
  CREATIVITY = 'creativity',
  OTHER = 'other'
}

// 基础提示词接口
export interface Prompt {
  name?: string; // 初始可选，但后续会验证
  description?: string;
  arguments?: PromptArgument[];
  messages?: PromptMessage[];
  tags?: PromptTag[]; // 提示词标签，用于分类和搜索
  category?: PromptCategory; // 提示词类别
  createdAt?: string; // 创建时间
  updatedAt?: string; // 更新时间
}

// 已加载的提示词（name必填）
export interface LoadedPrompt extends Prompt {
  name: string;
}

// 工具输入参数
export interface ToolInputArgs {
  [key: string]: string;
}

// 文本内容
export interface TextContent {
  type: "text";
  text: string;
  [key: string]: unknown; 
}

// 图像内容
export interface ImageContent {
  type: "image";
  data: string;
  mimeType: string;
  [key: string]: unknown;
}

// 资源对象（文本URI形式）
export interface TextUriResourceShape {
  text: string;
  uri: string;
  mimeType?: string;
  [key: string]: unknown;
}

// 资源对象（URI Blob形式）
export interface UriBlobResourceShape {
  uri: string;
  blob: string;
  mimeType?: string;
  [key: string]: unknown;
}

// 资源内容
export interface ResourceContent {
  type: "resource";
  resource: TextUriResourceShape | UriBlobResourceShape;
  [key: string]: unknown;
}

// 工具输出内容类型
export type ToolOutputContent = TextContent | ImageContent | ResourceContent;

// 工具输出
export interface ToolOutput {
  content: ToolOutputContent[];
  _meta?: { [key: string]: any };
  isError?: boolean;
  [key: string]: unknown; 
}

// 请求处理器额外参数
export type RequestHandlerExtra = any;

// 环境类型
export enum EnvironmentType {
  NODE = 'node',
  CLOUDFLARE = 'cloudflare'
}
