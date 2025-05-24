/**
 * MCP Prompt Server 配置
 */
require('dotenv').config();

/**
 * 默认配置
 */
const defaultConfig = {
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
function loadConfig() {
  // 合并环境变量和默认配置
  const config = { ...defaultConfig };
  
  // 服务器配置
  if (process.env.PORT) {
    config.server.port = parseInt(process.env.PORT, 10);
  }
  
  if (process.env.HOST) {
    config.server.host = process.env.HOST;
  }
  
  // 存储配置
  if (process.env.STORAGE_TYPE) {
    config.storage.type = process.env.STORAGE_TYPE;
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
  
  // Cloudflare KV 配置
  if (process.env.KV_NAMESPACE) {
    config.storage.cloudflareKV = {
      namespace: process.env.KV_NAMESPACE
    };
  }
  
  // Supabase 配置
  if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    config.storage.supabase = {
      url: process.env.SUPABASE_URL,
      apiKey: process.env.SUPABASE_KEY
    };
  }
  
  // 日志配置
  if (process.env.LOG_LEVEL) {
    config.logging.level = process.env.LOG_LEVEL;
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
function getConfig() {
  return loadConfig();
}

module.exports = {
  defaultConfig,
  loadConfig,
  getConfig
};
