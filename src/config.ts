/**
 * MCP Prompt Server 配置接口
 */
export interface Config {
  /**
   * 服务器配置
   */
  server: {
    /**
     * 服务器端口
     * @default 3000
     */
    port: number;
    
    /**
     * 服务器主机
     * @default "localhost"
     */
    host: string;
  };
  
  /**
   * 存储配置
   */
  storage: {
    /**
     * 存储类型
     * @default "file"
     */
    type: 'file';
    
    /**
     * 文件存储选项
     */
    file?: {
      /**
       * 提示词目录
       * @default "./prompts"
       */
      promptsDir: string;
      
      /**
       * 提示词文件名
       * @default "prompts.json"
       */
      promptsFile: string;
    };
    
    // 已移除 Cloudflare KV 和 Supabase 存储选项
  };
  
  /**
   * 日志配置
   */
  logging: {
    /**
     * 日志级别
     * @default "info"
     */
    level: 'debug' | 'info' | 'warn' | 'error';
    
    /**
     * 是否记录请求日志
     * @default true
     */
    logRequests: boolean;
  };
  
  /**
   * 缓存配置
   */
  cache: {
    /**
     * 是否启用缓存
     * @default true
     */
    enabled: boolean;
    
    /**
     * 缓存过期时间（秒）
     * @default 300
     */
    ttl: number;
  };
}

/**
 * 默认配置
 */
export const defaultConfig: Config = {
  server: {
    port: 3000,
    host: 'localhost'
  },
  storage: {
    type: 'file',
    file: {
      promptsDir: './prompts',
      promptsFile: 'prompts.json'
    }
  },
  logging: {
    level: 'info',
    logRequests: true
  },
  cache: {
    enabled: true,
    ttl: 300
  }
};

/**
 * 加载配置
 * @returns 配置对象
 */
export function loadConfig(): Config {
  // 合并环境变量和默认配置
  const config: Config = { ...defaultConfig };
  
  // 服务器配置
  if (process.env.PORT) {
    config.server.port = parseInt(process.env.PORT, 10);
  }
  
  if (process.env.HOST) {
    config.server.host = process.env.HOST;
  }
  
  // 存储类型
  if (process.env.STORAGE_TYPE) {
    // 只支持文件存储
    config.storage.type = 'file';
  }
  
  // 文件存储配置
  if (process.env.PROMPTS_DIR) {
    if (!config.storage.file) {
      config.storage.file = {
        promptsDir: process.env.PROMPTS_DIR,
        promptsFile: 'prompts.json'
      };
    } else {
      config.storage.file.promptsDir = process.env.PROMPTS_DIR;
    }
  }
  
  if (process.env.PROMPTS_FILE) {
    if (!config.storage.file) {
      config.storage.file = {
        promptsDir: './prompts',
        promptsFile: process.env.PROMPTS_FILE
      };
    } else {
      config.storage.file.promptsFile = process.env.PROMPTS_FILE;
    }
  }
  
  // 已移除 Cloudflare KV 和 Supabase 配置加载代码
  
  // 日志配置
  if (process.env.LOG_LEVEL) {
    config.logging.level = process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error';
  }
  
  if (process.env.LOG_REQUESTS) {
    config.logging.logRequests = process.env.LOG_REQUESTS === 'true';
  }
  
  // 缓存配置
  if (process.env.CACHE_ENABLED) {
    config.cache.enabled = process.env.CACHE_ENABLED === 'true';
  }
  
  if (process.env.CACHE_TTL) {
    config.cache.ttl = parseInt(process.env.CACHE_TTL, 10);
  }
  
  return config;
}

/**
 * 获取配置
 * @returns 配置对象
 */
export function getConfig(): Config {
  return loadConfig();
}
