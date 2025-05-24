/**
 * 错误处理工具
 * 提供统一的错误处理和日志记录功能
 */

// 错误类型枚举
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  STORAGE = 'STORAGE_ERROR',
  PROMPT = 'PROMPT_ERROR',
  SERVER = 'SERVER_ERROR',
  NETWORK = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR'
}

// 自定义错误类
export class AppError extends Error {
  type: ErrorType;
  statusCode: number;
  details?: any;

  constructor(message: string, type: ErrorType = ErrorType.UNKNOWN, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        type: this.type,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details
      }
    };
  }
}

// 验证错误
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.VALIDATION, 400, details);
    this.name = 'ValidationError';
  }
}

// 存储错误
export class StorageError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.STORAGE, 500, details);
    this.name = 'StorageError';
  }
}

// 提示词错误
export class PromptError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.PROMPT, 404, details);
    this.name = 'PromptError';
  }
}

// 服务器错误
export class ServerError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.SERVER, 500, details);
    this.name = 'ServerError';
  }
}

// 网络错误
export class NetworkError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.NETWORK, 503, details);
    this.name = 'NetworkError';
  }
}

// 日志级别
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

// 日志记录器
export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private isProduction: boolean = process.env.NODE_ENV === 'production';

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` - ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, meta));
    }
  }

  error(message: string, error?: Error, meta?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorDetails = error ? {
        name: error.name,
        message: error.message,
        stack: this.isProduction ? undefined : error.stack
      } : undefined;
      
      console.error(this.formatMessage(
        LogLevel.ERROR, 
        message, 
        { ...meta, error: errorDetails }
      ));
    }
  }

  fatal(message: string, error?: Error, meta?: any): void {
    if (this.shouldLog(LogLevel.FATAL)) {
      const errorDetails = error ? {
        name: error.name,
        message: error.message,
        stack: error.stack // 致命错误总是记录堆栈
      } : undefined;
      
      console.error(this.formatMessage(
        LogLevel.FATAL, 
        message, 
        { ...meta, error: errorDetails }
      ));
    }
  }
}

// 获取日志记录器实例
export const logger = Logger.getInstance();

// 全局错误处理函数
export function handleError(error: Error | AppError, context?: string): AppError {
  // 如果已经是 AppError，直接使用
  if (error instanceof AppError) {
    logger.error(`${context || 'Application error'}: ${error.message}`, error, error.details);
    return error;
  }
  
  // 将普通错误转换为 AppError
  const appError = new AppError(
    error.message || 'An unexpected error occurred',
    ErrorType.UNKNOWN,
    500,
    { stack: error.stack }
  );
  
  logger.error(`${context || 'Unexpected error'}: ${appError.message}`, error);
  return appError;
}

// 异步错误处理包装器
export function asyncErrorHandler(fn: Function) {
  return async function(...args: any[]) {
    try {
      return await fn(...args);
    } catch (error) {
      throw handleError(error as Error, fn.name);
    }
  };
}
