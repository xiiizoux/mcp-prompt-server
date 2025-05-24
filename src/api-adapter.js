/**
 * API 适配器 - 将前端 UI 请求转换为后端 API 调用
 * 简化版：使用内存存储，不依赖现有的 TypeScript 代码
 */

// 简单的日志记录器
class Logger {
  constructor(name) {
    this.name = name;
  }
  
  info(message, ...args) {
    console.log(`[INFO][${this.name}] ${message}`, ...args);
  }
  
  error(message, ...args) {
    console.error(`[ERROR][${this.name}] ${message}`, ...args);
  }
  
  warn(message, ...args) {
    console.warn(`[WARN][${this.name}] ${message}`, ...args);
  }
}

// 创建日志记录器
const logger = new Logger('APIAdapter');

// 存储
let storage = null;

// 默认设置
const defaultSettings = {
  serverName: 'MCP Prompt Server',
  defaultPageSize: 10,
  enableCache: true,
  cacheExpiration: 300,
  storageType: 'memory',
  logLevel: 'info',
  enableRequestLogging: true,
  allowImportExport: true,
  enableVersioning: false,
  maxVersions: 5,
  allowBatchOperations: true
};

// 内存存储
const memoryStore = {
  prompts: [],
  settings: { ...defaultSettings }
};

// 加载示例提示词
function loadSamplePrompts() {
  memoryStore.prompts = [
    {
      name: 'general_assistant',
      description: '通用助手提示词，用于日常对话和问答',
      category: '通用',
      tags: ['对话', '助手', '基础'],
      parameters: [
        {
          name: 'username',
          type: 'string',
          description: '用户名称',
          required: false,
          default: '用户'
        }
      ],
      messages: [
        {
          role: 'system',
          content: '你是一个有用的AI助手，能够回答用户的各种问题并提供帮助。'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      name: 'code_assistant',
      description: '代码助手提示词，用于编程和代码相关问题',
      category: '编程',
      tags: ['代码', '编程', '开发'],
      parameters: [],
      messages: [
        {
          role: 'system',
          content: '你是一个专业的编程助手，能够帮助用户解决各种编程问题，提供代码示例和解释。'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      name: 'writing_assistant',
      description: '写作助手提示词，用于文章创作和内容优化',
      category: '写作',
      tags: ['写作', '创作', '内容'],
      parameters: [
        {
          name: 'style',
          type: 'string',
          description: '写作风格',
          required: false,
          default: '正式'
        },
        {
          name: 'tone',
          type: 'string',
          description: '语气',
          required: false,
          default: '专业'
        }
      ],
      messages: [
        {
          role: 'system',
          content: '你是一个专业的写作助手，能够帮助用户创作各种类型的文章，提供写作建议和内容优化。'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

/**
 * 初始化 API 适配器
 * @param {Object} options - 配置选项
 */
async function initializeAdapter(options = {}) {
  try {
    // 使用内存存储
    logger.info('使用内存存储');
    
    // 加载示例提示词
    loadSamplePrompts();
    
    storage = {
      // 获取所有提示词
      async getAllPrompts() {
        return memoryStore.prompts;
      },
      
      // 获取提示词
      async getPrompt(name) {
        return memoryStore.prompts.find(p => p.name === name);
      },
      
      // 添加提示词
      async addPrompt(prompt) {
        // 检查是否已存在
        if (memoryStore.prompts.some(p => p.name === prompt.name)) {
          throw new Error(`提示词已存在: ${prompt.name}`);
        }
        
        memoryStore.prompts.push({
          ...prompt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        return { success: true };
      },
      
      // 更新提示词
      async updatePrompt(name, updatedPrompt) {
        const index = memoryStore.prompts.findIndex(p => p.name === name);
        if (index === -1) {
          throw new Error(`未找到提示词: ${name}`);
        }
        
        memoryStore.prompts[index] = {
          ...updatedPrompt,
          updated_at: new Date().toISOString()
        };
        
        return { success: true };
      },
      
      // 删除提示词
      async deletePrompt(name) {
        const initialLength = memoryStore.prompts.length;
        memoryStore.prompts = memoryStore.prompts.filter(p => p.name !== name);
        
        if (memoryStore.prompts.length === initialLength) {
          throw new Error(`未找到提示词: ${name}`);
        }
        
        return { success: true };
      },
      
      // 获取所有类别
      async getAllCategories() {
        // 从提示词中提取唯一类别
        const categories = [...new Set(memoryStore.prompts.map(p => p.category))];
        return categories.map(name => ({ name }));
      },
      
      // 获取所有标签
      async getAllTags() {
        // 从提示词中提取唯一标签
        const tags = [...new Set(memoryStore.prompts.flatMap(p => p.tags || []))];
        return tags.map(name => ({ name }));
      },
      
      // 获取设置
      async getSettings() {
        return memoryStore.settings;
      },
      
      // 更新设置
      async updateSettings(settings) {
        memoryStore.settings = { ...memoryStore.settings, ...settings };
        return { success: true };
      }
    };
    
    logger.info('API 适配器初始化成功');
  } catch (error) {
    logger.error('API 适配器初始化失败', error);
  }
}

/**
 * API 路由处理函数
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function handleApiRequest(req, res) {
  try {
    const path = req.path;
    const body = req.body || {};
    
    let result;
    
    // 处理不同的 API 路由
    switch (path) {
      // 提示词相关 API
      case '/search_prompts':
        result = await handleSearchPrompts(body);
        break;
      case '/get_prompt_details':
        result = await handleGetPromptDetails(body);
        break;
      case '/get_prompt_names':
        result = await handleGetPromptNames();
        break;
      case '/add_new_prompt':
        result = await handleAddPrompt(body);
        break;
      case '/update_prompt':
        result = await handleUpdatePrompt(body);
        break;
      case '/delete_prompt':
        result = await handleDeletePrompt(body);
        break;
      case '/export_prompts':
        result = await handleExportPrompts(body);
        break;
      case '/import_prompts':
        result = await handleImportPrompts(body);
        break;
        
      // 类别相关 API
      case '/get_all_categories':
        result = await handleGetAllCategories();
        break;
      case '/get_category_stats':
        result = await handleGetCategoryStats();
        break;
      case '/add_category':
        result = await handleAddCategory(body);
        break;
      case '/update_category':
        result = await handleUpdateCategory(body);
        break;
      case '/delete_category':
        result = await handleDeleteCategory(body);
        break;
        
      // 标签相关 API
      case '/get_all_tags':
        result = await handleGetAllTags();
        break;
      case '/get_tag_stats':
        result = await handleGetTagStats();
        break;
      case '/add_tag':
        result = await handleAddTag(body);
        break;
      case '/update_tag':
        result = await handleUpdateTag(body);
        break;
      case '/delete_tag':
        result = await handleDeleteTag(body);
        break;
        
      // 设置相关 API
      case '/get_settings':
        result = await handleGetSettings();
        break;
      case '/update_settings':
        result = await handleUpdateSettings(body);
        break;
      case '/reset_settings':
        result = await handleResetSettings();
        break;
      case '/get_system_status':
        result = await handleGetSystemStatus();
        break;
        
      default:
        return res.status(404).json({ error: { message: '未找到 API 路由' } });
    }
    
    return res.json(result);
  } catch (error) {
    logger.error('API 请求处理失败', error);
    return res.status(500).json({ 
      error: { 
        message: error.message || '服务器内部错误',
        code: error.code || 'INTERNAL_SERVER_ERROR'
      } 
    });
  }
}

// 提示词相关处理函数
async function handleSearchPrompts(params) {
  const { query = '', category, tags, page = 1, pageSize = 10 } = params;
  
  // 获取所有提示词
  let prompts = await storage.getAllPrompts();
  
  // 按名称和描述搜索
  if (query) {
    const lowerQuery = query.toLowerCase();
    prompts = prompts.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      (p.description && p.description.toLowerCase().includes(lowerQuery))
    );
  }
  
  // 按类别过滤
  if (category) {
    prompts = prompts.filter(p => p.category === category || p.category_id === category);
  }
  
  // 按标签过滤
  if (tags && tags.length > 0) {
    prompts = prompts.filter(p => 
      p.tags && tags.every(tag => p.tags.includes(tag))
    );
  }
  
  // 计算分页
  const totalItems = prompts.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedPrompts = prompts.slice(startIndex, endIndex);
  
  return {
    prompts: paginatedPrompts,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages
    }
  };
}

async function handleGetPromptDetails(params) {
  const { name } = params;
  if (!name) {
    throw new Error('提示词名称不能为空');
  }
  
  const prompt = await storage.getPrompt(name);
  if (!prompt) {
    throw new Error(`未找到提示词: ${name}`);
  }
  
  return prompt;
}

async function handleGetPromptNames() {
  const prompts = await storage.getAllPrompts();
  return prompts.map(p => p.name);
}

async function handleAddPrompt(prompt) {
  if (!prompt || !prompt.name) {
    throw new Error('提示词数据不完整');
  }
  
  // 检查名称是否已存在
  const existingPrompt = await storage.getPrompt(prompt.name);
  if (existingPrompt) {
    throw new Error(`提示词名称已存在: ${prompt.name}`);
  }
  
  // 添加到存储
  return await storage.addPrompt(prompt);
}

async function handleUpdatePrompt(params) {
  const { name, updatedPrompt } = params;
  if (!name || !updatedPrompt) {
    throw new Error('更新数据不完整');
  }
  
  // 更新提示词
  return await storage.updatePrompt(name, updatedPrompt);
}

async function handleDeletePrompt(params) {
  const { name } = params;
  if (!name) {
    throw new Error('提示词名称不能为空');
  }
  
  // 删除提示词
  return await storage.deletePrompt(name);
}

async function handleExportPrompts(params) {
  const { names } = params;
  if (!names || !Array.isArray(names)) {
    throw new Error('导出参数无效');
  }
  
  // 获取所有提示词
  const allPrompts = await storage.getAllPrompts();
  
  // 如果没有指定名称，则导出所有提示词
  if (names.length === 0) {
    return allPrompts;
  }
  
  // 导出指定的提示词
  const exportedPrompts = allPrompts.filter(p => names.includes(p.name));
  
  return exportedPrompts;
}

async function handleImportPrompts(params) {
  const { prompts } = params;
  if (!prompts || !Array.isArray(prompts)) {
    throw new Error('导入数据无效');
  }
  
  // 导入提示词
  const results = [];
  for (const prompt of prompts) {
    try {
      // 检查提示词是否存在
      const existingPrompt = await storage.getPrompt(prompt.name);
      
      if (existingPrompt) {
        // 如果存在，则更新
        await storage.updatePrompt(prompt.name, prompt);
      } else {
        // 如果不存在，则添加
        await storage.addPrompt(prompt);
      }
      results.push({ name: prompt.name, success: true });
    } catch (error) {
      results.push({ name: prompt.name, success: false, error: error.message });
    }
  }
  
  return { success: true, count: prompts.length, results };
}

// 类别相关处理函数
async function handleGetAllCategories() {
  return await storage.getAllCategories();
}

async function handleGetCategoryStats() {
  // 获取所有提示词和类别
  const [prompts, categories] = await Promise.all([
    storage.getAllPrompts(),
    storage.getAllCategories()
  ]);
  
  // 计算每个类别的提示词数量
  const stats = {};
  
  // 初始化所有类别的计数为 0
  categories.forEach(category => {
    stats[category.name] = 0;
  });
  
  // 统计提示词数量
  prompts.forEach(prompt => {
    const category = prompt.category || '未分类';
    if (!stats[category]) {
      stats[category] = 0;
    }
    stats[category]++;
  });
  
  return Object.entries(stats).map(([name, count]) => ({ name, count }));
}

async function handleAddCategory(params) {
  const { name, description } = params;
  if (!name) {
    throw new Error('类别名称不能为空');
  }
  
  // 检查类别是否已存在
  const categories = await storage.getAllCategories();
  const exists = categories.some(c => c.name === name);
  
  if (exists) {
    throw new Error(`类别已存在: ${name}`);
  }
  
  // 添加类别
  // 注意：这里需要实现 storage.addCategory 方法
  // 在当前实现中，我们返回成功，但实际上并没有添加类别
  
  return { success: true, name, description };
}

async function handleUpdateCategory(params) {
  const { oldName, newName } = params;
  if (!oldName || !newName) {
    throw new Error('类别名称不能为空');
  }
  
  // 更新所有使用该类别的提示词
  let updatedCount = 0;
  
  for (let i = 0; i < memoryStore.prompts.length; i++) {
    if (memoryStore.prompts[i].category === oldName) {
      memoryStore.prompts[i].category = newName;
      memoryStore.prompts[i].updatedAt = new Date().toISOString();
      updatedCount++;
    }
  }
  
  return { success: true, updatedCount };
}

async function handleDeleteCategory(params) {
  const { name } = params;
  if (!name) {
    throw new Error('类别名称不能为空');
  }
  
  // 删除所有使用该类别的提示词的类别属性
  let updatedCount = 0;
  
  for (let i = 0; i < memoryStore.prompts.length; i++) {
    if (memoryStore.prompts[i].category === name) {
      memoryStore.prompts[i].category = '';
      memoryStore.prompts[i].updatedAt = new Date().toISOString();
      updatedCount++;
    }
  }
  
  return { success: true, updatedCount };
}

// 标签相关处理函数
async function handleGetAllTags() {
  return await storage.getAllTags();
}

async function handleGetTagStats() {
  const tagStats = {};
  
  memoryStore.prompts.forEach(prompt => {
    if (prompt.tags && Array.isArray(prompt.tags)) {
      prompt.tags.forEach(tag => {
        tagStats[tag] = (tagStats[tag] || 0) + 1;
      });
    }
  });
  
  return Object.entries(tagStats).map(([name, count]) => ({ name, count }));
}

async function handleAddTag(params) {
  // 标签只是提示词的一个属性，不需要单独存储
  return { success: true };
}

async function handleUpdateTag(params) {
  const { oldName, newName } = params;
  if (!oldName || !newName) {
    throw new Error('标签名称不能为空');
  }
  
  // 更新所有使用该标签的提示词
  let updatedCount = 0;
  
  for (let i = 0; i < memoryStore.prompts.length; i++) {
    const prompt = memoryStore.prompts[i];
    if (prompt.tags && Array.isArray(prompt.tags) && prompt.tags.includes(oldName)) {
      prompt.tags = prompt.tags.map(t => t === oldName ? newName : t);
      prompt.updatedAt = new Date().toISOString();
      updatedCount++;
    }
  }
  
  return { success: true, updatedCount };
}

async function handleDeleteTag(params) {
  const { name } = params;
  if (!name) {
    throw new Error('标签名称不能为空');
  }
  
  // 从所有使用该标签的提示词中删除该标签
  let updatedCount = 0;
  
  for (let i = 0; i < memoryStore.prompts.length; i++) {
    const prompt = memoryStore.prompts[i];
    if (prompt.tags && Array.isArray(prompt.tags) && prompt.tags.includes(name)) {
      prompt.tags = prompt.tags.filter(t => t !== name);
      prompt.updatedAt = new Date().toISOString();
      updatedCount++;
    }
  }
  
  return { success: true, updatedCount };
}

// 设置相关处理函数
async function handleGetSettings() {
  return await storage.getSettings();
}

async function handleUpdateSettings(params) {
  const { settings } = params;
  if (!settings) {
    throw new Error('设置数据不能为空');
  }
  
  // 获取当前设置
  const currentSettings = await storage.getSettings();
  
  // 更新设置
  const updatedSettings = { ...currentSettings, ...settings };
  
  // 如果 storage 对象有 updateSettings 方法，则使用它
  if (storage.updateSettings) {
    await storage.updateSettings(updatedSettings);
  }
  
  return { success: true };
}

async function handleResetSettings() {
  // 重置为默认设置
  const defaultSettings = {
    serverName: 'MCP Prompt Server',
    defaultPageSize: 10,
    enableCache: true,
    cacheExpiration: 300,
    storageType: 'memory',
    logLevel: 'info',
    enableRequestLogging: true,
    allowImportExport: true,
    enableVersioning: false,
    maxVersions: 5,
    allowBatchOperations: true
  };
  
  // 如果 storage 对象有 updateSettings 方法，则使用它
  if (storage.updateSettings) {
    await storage.updateSettings(defaultSettings);
  }
  
  return { success: true };
}

async function handleGetSystemStatus() {
  return {
    status: 'running',
    promptCount: memoryStore.prompts.length,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    version: '1.0.0',
    lastUpdated: new Date().toISOString()
  };
}

/**
 * API 路由处理函数
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function handleApiRequest(req, res) {
  try {
    const path = req.path;
    const body = req.body || {};
    
    // 确保已初始化
    await initializeAdapter();
    
    let result;
    
    // 处理不同的 API 路由
    switch (path) {
      // 提示词相关 API
      case '/search_prompts':
        result = await handleSearchPrompts(body);
        break;
      case '/get_prompt_details':
        result = await handleGetPromptDetails(body);
        break;
      case '/get_prompt_names':
        result = await handleGetPromptNames();
        break;
      case '/add_new_prompt':
        result = await handleAddPrompt(body);
        break;
      case '/update_prompt':
        result = await handleUpdatePrompt(body);
        break;
      case '/delete_prompt':
        result = await handleDeletePrompt(body);
        break;
      case '/export_prompts':
        result = await handleExportPrompts(body);
        break;
      case '/import_prompts':
        result = await handleImportPrompts(body);
        break;
        
      // 类别相关 API
      case '/get_all_categories':
        result = await handleGetAllCategories();
        break;
      case '/get_category_stats':
        result = await handleGetCategoryStats();
        break;
      case '/add_category':
        result = await handleAddCategory(body);
        break;
      case '/update_category':
        result = await handleUpdateCategory(body);
        break;
      case '/delete_category':
        result = await handleDeleteCategory(body);
        break;
        
      // 标签相关 API
      case '/get_all_tags':
        result = await handleGetAllTags();
        break;
      case '/get_tag_stats':
        result = await handleGetTagStats();
        break;
      case '/add_tag':
        result = await handleAddTag(body);
        break;
      case '/update_tag':
        result = await handleUpdateTag(body);
        break;
      case '/delete_tag':
        result = await handleDeleteTag(body);
        break;
        
      // 设置相关 API
      case '/get_settings':
        result = await handleGetSettings();
        break;
      case '/update_settings':
        result = await handleUpdateSettings(body);
        break;
      case '/reset_settings':
        result = await handleResetSettings();
        break;
      case '/get_system_status':
        result = await handleGetSystemStatus();
        break;
        
      default:
        return res.status(404).json({ error: { message: '未找到 API 路由' } });
    }
    
    return res.json(result);
  } catch (error) {
    logger.error('API 请求处理失败', error);
    return res.status(500).json({ 
      error: { 
        message: error.message || '服务器内部错误',
        code: error.code || 'INTERNAL_SERVER_ERROR'
      } 
    });
  }
}

// 提示词相关处理函数
async function handleSearchPrompts(params) {
  const { query = '', category = '', tags = [], page = 1, pageSize = 10 } = params;
  
  // 获取所有提示词
  let prompts = await storage.getAllPrompts();
  
  // 按名称和描述搜索
  if (query) {
    const lowerQuery = query.toLowerCase();
    prompts = prompts.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      (p.description && p.description.toLowerCase().includes(lowerQuery))
    );
  }
  
  // 按类别过滤
  if (category) {
    prompts = prompts.filter(p => p.category === category || p.category_id === category);
  }
  
  // 按标签过滤
  if (tags && tags.length > 0) {
    prompts = prompts.filter(p => 
      p.tags && tags.every(tag => p.tags.includes(tag))
    );
  }
  
  // 计算分页
  const totalItems = prompts.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedPrompts = prompts.slice(startIndex, endIndex);
  
  return {
    prompts: paginatedPrompts,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages
    }
  };
}

async function handleGetPromptDetails(params) {
  const { name } = params;
  if (!name) {
    throw new Error('提示词名称不能为空');
  }
  return await storage.getPrompt(name);
}

async function handleGetPromptNames() {
  const prompts = await storage.getAllPrompts();
  return prompts.map(p => p.name);
}

async function handleAddPrompt(prompt) {
  if (!prompt || !prompt.name) {
    throw new Error('提示词数据不完整');
  }
  
  const result = await storage.addPrompt(prompt);
  return { success: result };
}

async function handleUpdatePrompt(params) {
  const { name, updatedPrompt } = params;
  if (!name || !updatedPrompt) {
    throw new Error('更新数据不完整');
  }
  
  const result = await storage.updatePrompt(name, updatedPrompt);
  return { success: result };
}

async function handleDeletePrompt(params) {
  const { name } = params;
  if (!name) {
    throw new Error('提示词名称不能为空');
  }
  
  const result = await storage.deletePrompt(name);
  return { success: result };
}

async function handleExportPrompts(params) {
  const { names = [] } = params;
  
  if (!Array.isArray(names)) {
    throw new Error('导出参数无效');
  }
  
  // 如果没有指定名称，则导出所有提示词
  if (names.length === 0) {
    return await storage.getAllPrompts();
  }
  
  // 导出指定的提示词
  const prompts = [];
  for (const name of names) {
    const prompt = await storage.getPrompt(name);
    if (prompt) {
      prompts.push(prompt);
    }
  }
  
  return prompts;
}

async function handleImportPrompts(params) {
  const { prompts } = params;
  if (!prompts || !Array.isArray(prompts)) {
    throw new Error('导入数据无效');
  }
  
  const results = [];
  for (const prompt of prompts) {
    try {
      const result = await storage.addPrompt(prompt);
      results.push({
        name: prompt.name,
        success: result
      });
    } catch (error) {
      results.push({
        name: prompt.name,
        success: false,
        error: error.message
      });
    }
  }
  
  return { results };
}

// 类别相关处理函数
async function handleGetAllCategories() {
  const prompts = await storage.getAllPrompts();
  const categories = new Set();
  
  prompts.forEach(prompt => {
    if (prompt.category) {
      categories.add(prompt.category);
    }
  });
  
  return Array.from(categories);
}

async function handleGetCategoryStats() {
  const prompts = await storage.getAllPrompts();
  const categoryStats = {};
  
  prompts.forEach(prompt => {
    if (prompt.category) {
      categoryStats[prompt.category] = (categoryStats[prompt.category] || 0) + 1;
    }
  });
  
  return Object.entries(categoryStats).map(([name, count]) => ({ name, count }));
}

async function handleAddCategory(params) {
  // 类别只是提示词的一个属性，不需要单独存储
  // 这个 API 只是为了保持接口一致性
  return { success: true };
}

async function handleUpdateCategory(params) {
  const { oldName, newName } = params;
  if (!oldName || !newName) {
    throw new Error('类别名称不能为空');
  }
  
  // 更新所有使用该类别的提示词
  const prompts = await storage.getAllPrompts();
  const updatedPrompts = prompts.filter(p => p.category === oldName);
  
  for (const prompt of updatedPrompts) {
    prompt.category = newName;
    await storage.updatePrompt(prompt.name, prompt);
  }
  
  return { success: true, updatedCount: updatedPrompts.length };
}

async function handleDeleteCategory(params) {
  const { name } = params;
  if (!name) {
    throw new Error('类别名称不能为空');
  }
  
  // 删除所有使用该类别的提示词的类别属性
  const prompts = await storage.getAllPrompts();
  const updatedPrompts = prompts.filter(p => p.category === name);
  
  for (const prompt of updatedPrompts) {
    prompt.category = '';
    await storage.updatePrompt(prompt.name, prompt);
  }
  
  return { success: true, updatedCount: updatedPrompts.length };
}

// 标签相关处理函数
async function handleGetAllTags() {
  const prompts = await storage.getAllPrompts();
  const tags = new Set();
  
  prompts.forEach(prompt => {
    if (prompt.tags && Array.isArray(prompt.tags)) {
      prompt.tags.forEach(tag => tags.add(tag));
    }
  });
  
  return Array.from(tags);
}

async function handleGetTagStats() {
  const prompts = await storage.getAllPrompts();
  const tagStats = {};
  
  prompts.forEach(prompt => {
    if (prompt.tags && Array.isArray(prompt.tags)) {
      prompt.tags.forEach(tag => {
        tagStats[tag] = (tagStats[tag] || 0) + 1;
      });
    }
  });
  
  return Object.entries(tagStats).map(([name, count]) => ({ name, count }));
}

async function handleAddTag(params) {
  // 标签只是提示词的一个属性，不需要单独存储
  // 这个 API 只是为了保持接口一致性
  return { success: true };
}

async function handleUpdateTag(params) {
  const { oldName, newName } = params;
  if (!oldName || !newName) {
    throw new Error('标签名称不能为空');
  }
  
  // 更新所有使用该标签的提示词
  const prompts = await storage.getAllPrompts();
  const updatedPrompts = prompts.filter(p => p.tags && p.tags.includes(oldName));
  
  for (const prompt of updatedPrompts) {
    prompt.tags = prompt.tags.map(t => t === oldName ? newName : t);
    await storage.updatePrompt(prompt.name, prompt);
  }
  
  return { success: true, updatedCount: updatedPrompts.length };
}

async function handleDeleteTag(params) {
  const { name } = params;
  if (!name) {
    throw new Error('标签名称不能为空');
  }
  
  // 从所有使用该标签的提示词中删除该标签
  const prompts = await storage.getAllPrompts();
  const updatedPrompts = prompts.filter(p => p.tags && p.tags.includes(name));
  
  for (const prompt of updatedPrompts) {
    prompt.tags = prompt.tags.filter(t => t !== name);
    await storage.updatePrompt(prompt.name, prompt);
  }
  
  return { success: true, updatedCount: updatedPrompts.length };
}

// 设置相关处理函数
async function handleGetSettings() {
  return await storage.getSettings();
}

async function handleUpdateSettings(params) {
  const { settings } = params;
  if (!settings) {
    throw new Error('设置数据不能为空');
  }
  
  // 获取当前设置
  const currentSettings = await storage.getSettings();
  
  // 更新设置
  const updatedSettings = { ...currentSettings, ...settings };
  
  // 如果 storage 对象有 updateSettings 方法，则使用它
  if (storage.updateSettings) {
    await storage.updateSettings(updatedSettings);
  }
  
  return { success: true };
}

async function handleResetSettings() {
  // 重置为默认设置
  const defaultSettings = {
    serverName: 'MCP Prompt Server',
    defaultPageSize: 10,
    enableCache: true,
    cacheExpiration: 300,
    storageType: 'memory',
    logLevel: 'info',
    enableRequestLogging: true,
    allowImportExport: true,
    enableVersioning: false,
    maxVersions: 5,
    allowBatchOperations: true
  };
  
  // 如果 storage 对象有 updateSettings 方法，则使用它
  if (storage.updateSettings) {
    await storage.updateSettings(defaultSettings);
  }
  
  return { success: true };
}

async function handleGetSystemStatus() {
  return {
    status: 'running',
    promptCount: memoryStore.prompts.length,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    version: '1.0.0',
    lastUpdated: new Date().toISOString()
  };
}

// 注意：旧版本的 API 处理函数已经被删除，因为它们使用了未定义的 promptService 变量
// 现在使用的是上面定义的使用 storage 对象的函数

module.exports = {
  initializeAdapter,
  handleApiRequest
};
