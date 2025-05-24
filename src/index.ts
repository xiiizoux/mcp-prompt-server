/**
 * MCP Prompt Server - MCP 工具实现
 */
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

// 提示词接口定义
interface Prompt {
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  messages: {
    role: string;
    content: string;
  }[];
  createdAt?: string;
  updatedAt?: string;
}

// 存储提示词的内存对象
let prompts: Record<string, Prompt> = {};

// 加载提示词
function loadPrompts(): void {
  try {
    // 修正路径：使用项目根目录下的 src/prompts 目录
    const promptsDir = path.join(process.cwd(), 'src', 'prompts');
    console.log(`加载提示词目录: ${promptsDir}`);
    const files = fs.readdirSync(promptsDir);
    
    prompts = {}; // 清空当前提示词
    
    // 加载每个 YAML 提示词文件
    for (const file of files) {
      if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        try {
          const content = fs.readFileSync(path.join(promptsDir, file), 'utf8');
          const data = yaml.parse(content) as Prompt;
          
          if (data && data.name) {
            prompts[data.name] = {
              ...data,
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          }
        } catch (err) {
          console.error(`无法解析提示词文件 ${file}:`, err);
        }
      }
    }
    
    console.log(`已加载 ${Object.keys(prompts).length} 个提示词`);
  } catch (err) {
    console.error('加载提示词失败:', err);
  }
}

// 初始化时加载提示词
loadPrompts();

// MCP 工具实现
export const tools = {
  // 获取所有提示词名称
  get_prompt_names: async () => {
    return {
      status: 'success',
      data: Object.keys(prompts)
    };
  },
  
  // 获取提示词详情
  get_prompt_details: async (params: { name: string }) => {
    const { name } = params;
    
    if (!name) {
      return {
        status: 'error',
        message: '缺少提示词名称'
      };
    }
    
    const prompt = prompts[name];
    if (!prompt) {
      return {
        status: 'error',
        message: `提示词 '${name}' 不存在`
      };
    }
    
    return {
      status: 'success',
      data: prompt
    };
  },
  
  // 重新加载提示词
  reload_prompts: async () => {
    loadPrompts();
    return {
      status: 'success',
      message: `已重新加载 ${Object.keys(prompts).length} 个提示词`
    };
  },

  // 获取提示词模板
  get_prompt_template: async () => {
    try {
      const templatePath = path.join(process.cwd(), 'src', 'templates', 'prompt_template.yaml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      return {
        status: 'success',
        data: templateContent
      };
    } catch (err) {
      return {
        status: 'error',
        message: `获取提示词模板失败: ${err}`
      };
    }
  },

  // 创建新提示词
  create_prompt: async (params: { name: string, content: string }) => {
    const { name, content } = params;
    
    if (!name || !content) {
      return {
        status: 'error',
        message: '缺少提示词名称或内容'
      };
    }
    
    try {
      // 检查提示词名称是否已存在
      if (prompts[name]) {
        return {
          status: 'error',
          message: `提示词 '${name}' 已存在`
        };
      }
      
      // 解析 YAML 内容
      let promptData;
      try {
        promptData = yaml.parse(content);
      } catch (parseErr) {
        return {
          status: 'error',
          message: `YAML 解析失败: ${parseErr}`
        };
      }
      
      // 验证提示词数据
      if (!promptData.name || !promptData.messages || !Array.isArray(promptData.messages)) {
        return {
          status: 'error',
          message: '提示词格式无效: 缺少必要字段 (name, messages)'
        };
      }
      
      // 确保提示词名称与文件名一致
      promptData.name = name;
      
      // 添加时间戳
      promptData.createdAt = new Date().toISOString();
      promptData.updatedAt = new Date().toISOString();
      
      // 将提示词写入文件
      const promptsDir = path.join(process.cwd(), 'src', 'prompts');
      const filePath = path.join(promptsDir, `${name}.yaml`);
      
      // 将对象转换回 YAML
      const yamlContent = yaml.stringify(promptData);
      fs.writeFileSync(filePath, yamlContent, 'utf8');
      
      // 重新加载提示词
      loadPrompts();
      
      return {
        status: 'success',
        message: `提示词 '${name}' 创建成功`,
        data: promptData
      };
    } catch (err) {
      return {
        status: 'error',
        message: `创建提示词失败: ${err}`
      };
    }
  }
};

// 导出工具描述
export const toolDescriptions = [
  {
    name: 'get_prompt_names',
    description: '获取所有可用的提示词名称',
    parameters: {}
  },
  {
    name: 'get_prompt_details',
    description: '获取指定提示词的详细信息',
    parameters: {
      name: {
        type: 'string',
        description: '提示词名称'
      }
    }
  },
  {
    name: 'reload_prompts',
    description: '重新加载所有提示词',
    parameters: {}
  },
  {
    name: 'get_prompt_template',
    description: '获取提示词 YAML 模板',
    parameters: {}
  },
  {
    name: 'create_prompt',
    description: '创建新的提示词并保存为 YAML 文件',
    parameters: {
      name: {
        type: 'string',
        description: '提示词名称，将用作文件名'
      },
      content: {
        type: 'string',
        description: '提示词的 YAML 格式内容'
      }
    }
  }
];

// 如果直接运行此文件，输出工具信息
if (require.main === module) {
  console.log('MCP Prompt Server 工具已加载');
  console.log(`可用工具: ${Object.keys(tools).join(', ')}`);
}
