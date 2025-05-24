import { CloudflareKVStorage } from '../../src/storage/cloudflare-kv-storage.js';
import { LoadedPrompt, PromptCategory, PromptTag } from '../../src/types.js';

describe('CloudflareKVStorage', () => {
  // 模拟 KV 命名空间
  const mockKV = {
    get: jest.fn(),
    put: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    list: jest.fn()
  };

  let kvStorage: CloudflareKVStorage;
  
  // 测试数据
  const samplePrompts: LoadedPrompt[] = [
    {
      name: 'test_prompt_1',
      description: 'Test prompt 1',
      parameters: [],
      messages: [{ role: 'system', content: 'You are a test assistant' }],
      tags: ['test', 'sample'] as PromptTag[],
      category: 'testing' as PromptCategory
    },
    {
      name: 'test_prompt_2',
      description: 'Test prompt 2',
      parameters: [{ name: 'param1', type: 'string', description: 'A test parameter' }],
      messages: [{ role: 'system', content: 'You are another test assistant' }],
      tags: ['test', 'advanced'] as PromptTag[],
      category: 'development' as PromptCategory
    }
  ];

  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
    
    // 创建 CloudflareKVStorage 实例
    kvStorage = new CloudflareKVStorage({
      namespace: mockKV as unknown as KVNamespace
    });
    
    // 模拟 KV 列表操作
    mockKV.list.mockResolvedValue({
      keys: [
        { name: 'prompt:test_prompt_1' },
        { name: 'prompt:test_prompt_2' }
      ],
      list_complete: true
    });
    
    // 模拟 KV 获取操作
    mockKV.get.mockImplementation((key) => {
      if (key === 'prompt:test_prompt_1') {
        return Promise.resolve(JSON.stringify(samplePrompts[0]));
      } else if (key === 'prompt:test_prompt_2') {
        return Promise.resolve(JSON.stringify(samplePrompts[1]));
      } else if (key === 'all_prompts') {
        return Promise.resolve(JSON.stringify(samplePrompts));
      }
      return Promise.resolve(null);
    });
  });

  describe('initialize', () => {
    it('should initialize without errors', async () => {
      await expect(kvStorage.initialize()).resolves.not.toThrow();
    });
  });

  describe('loadAllPrompts', () => {
    it('should load all prompts from KV store', async () => {
      const prompts = await kvStorage.loadAllPrompts();
      
      expect(mockKV.get).toHaveBeenCalledWith('all_prompts');
      expect(prompts.length).toBe(2);
      expect(prompts[0].name).toBe('test_prompt_1');
      expect(prompts[1].name).toBe('test_prompt_2');
    });

    it('should load individual prompts if all_prompts key is not found', async () => {
      // 模拟 all_prompts 键不存在
      mockKV.get.mockImplementation((key) => {
        if (key === 'prompt:test_prompt_1') {
          return Promise.resolve(JSON.stringify(samplePrompts[0]));
        } else if (key === 'prompt:test_prompt_2') {
          return Promise.resolve(JSON.stringify(samplePrompts[1]));
        }
        return Promise.resolve(null);
      });
      
      const prompts = await kvStorage.loadAllPrompts();
      
      expect(mockKV.list).toHaveBeenCalledWith({ prefix: 'prompt:' });
      expect(prompts.length).toBe(2);
      expect(prompts[0].name).toBe('test_prompt_1');
      expect(prompts[1].name).toBe('test_prompt_2');
    });
  });

  describe('addPrompt', () => {
    it('should add a new prompt', async () => {
      const newPrompt: LoadedPrompt = {
        name: 'new_prompt',
        description: 'A new prompt',
        parameters: [],
        messages: [{ role: 'system', content: 'You are a new assistant' }],
        tags: ['new'] as PromptTag[],
        category: 'testing' as PromptCategory
      };
      
      // 模拟当前已加载的提示词
      mockKV.get.mockImplementation((key) => {
        if (key === 'all_prompts') {
          return Promise.resolve(JSON.stringify(samplePrompts));
        } else if (key === 'prompt:new_prompt') {
          return Promise.resolve(null); // 新提示词不存在
        }
        return Promise.resolve(null);
      });
      
      const result = await kvStorage.addPrompt(newPrompt);
      
      expect(result).toBe(true);
      // 验证单个提示词被保存
      expect(mockKV.put).toHaveBeenCalledWith(
        'prompt:new_prompt',
        JSON.stringify(newPrompt)
      );
      // 验证所有提示词列表被更新
      expect(mockKV.put).toHaveBeenCalledWith(
        'all_prompts',
        expect.any(String)
      );
      
      // 验证更新的提示词列表包含新的提示词
      const allPromptsCall = mockKV.put.mock.calls.find(call => call[0] === 'all_prompts');
      const updatedPrompts = JSON.parse(allPromptsCall[1]);
      expect(updatedPrompts.length).toBe(3);
      expect(updatedPrompts[2].name).toBe('new_prompt');
    });

    it('should not add a prompt with duplicate name', async () => {
      const duplicatePrompt: LoadedPrompt = {
        name: 'test_prompt_1', // 已存在的名称
        description: 'Duplicate prompt',
        parameters: [],
        messages: [{ role: 'system', content: 'Duplicate' }],
        tags: [] as PromptTag[],
        category: 'testing' as PromptCategory
      };
      
      // 模拟当前已加载的提示词
      mockKV.get.mockImplementation((key) => {
        if (key === 'all_prompts') {
          return Promise.resolve(JSON.stringify(samplePrompts));
        } else if (key === 'prompt:test_prompt_1') {
          return Promise.resolve(JSON.stringify(samplePrompts[0])); // 已存在
        }
        return Promise.resolve(null);
      });
      
      const result = await kvStorage.addPrompt(duplicatePrompt);
      
      expect(result).toBe(false);
      // 验证没有保存任何内容
      expect(mockKV.put).not.toHaveBeenCalled();
    });
  });

  describe('updatePrompt', () => {
    it('should update an existing prompt', async () => {
      const updatedPrompt: LoadedPrompt = {
        name: 'test_prompt_1',
        description: 'Updated description',
        parameters: [],
        messages: [{ role: 'system', content: 'Updated content' }],
        tags: ['updated'] as PromptTag[],
        category: 'testing' as PromptCategory
      };
      
      // 模拟当前已加载的提示词
      mockKV.get.mockImplementation((key) => {
        if (key === 'all_prompts') {
          return Promise.resolve(JSON.stringify(samplePrompts));
        } else if (key === 'prompt:test_prompt_1') {
          return Promise.resolve(JSON.stringify(samplePrompts[0])); // 已存在
        }
        return Promise.resolve(null);
      });
      
      const result = await kvStorage.updatePrompt('test_prompt_1', updatedPrompt);
      
      expect(result).toBe(true);
      // 验证单个提示词被更新
      expect(mockKV.put).toHaveBeenCalledWith(
        'prompt:test_prompt_1',
        JSON.stringify(updatedPrompt)
      );
      // 验证所有提示词列表被更新
      expect(mockKV.put).toHaveBeenCalledWith(
        'all_prompts',
        expect.any(String)
      );
      
      // 验证更新的提示词列表包含更新后的提示词
      const allPromptsCall = mockKV.put.mock.calls.find(call => call[0] === 'all_prompts');
      const updatedPrompts = JSON.parse(allPromptsCall[1]);
      expect(updatedPrompts.length).toBe(2);
      expect(updatedPrompts[0].name).toBe('test_prompt_1');
      expect(updatedPrompts[0].description).toBe('Updated description');
    });

    it('should return false when updating non-existent prompt', async () => {
      const updatedPrompt: LoadedPrompt = {
        name: 'non_existent',
        description: 'This prompt does not exist',
        parameters: [],
        messages: [{ role: 'system', content: 'Content' }],
        tags: [] as PromptTag[],
        category: 'testing' as PromptCategory
      };
      
      // 模拟当前已加载的提示词
      mockKV.get.mockImplementation((key) => {
        if (key === 'all_prompts') {
          return Promise.resolve(JSON.stringify(samplePrompts));
        } else if (key === 'prompt:non_existent') {
          return Promise.resolve(null); // 不存在
        }
        return Promise.resolve(null);
      });
      
      const result = await kvStorage.updatePrompt('non_existent', updatedPrompt);
      
      expect(result).toBe(false);
      // 验证没有保存任何内容
      expect(mockKV.put).not.toHaveBeenCalled();
    });
  });

  describe('deletePrompt', () => {
    it('should delete an existing prompt', async () => {
      // 模拟当前已加载的提示词
      mockKV.get.mockImplementation((key) => {
        if (key === 'all_prompts') {
          return Promise.resolve(JSON.stringify(samplePrompts));
        } else if (key === 'prompt:test_prompt_1') {
          return Promise.resolve(JSON.stringify(samplePrompts[0])); // 已存在
        }
        return Promise.resolve(null);
      });
      
      const result = await kvStorage.deletePrompt('test_prompt_1');
      
      expect(result).toBe(true);
      // 验证提示词被删除
      expect(mockKV.delete).toHaveBeenCalledWith('prompt:test_prompt_1');
      // 验证所有提示词列表被更新
      expect(mockKV.put).toHaveBeenCalledWith(
        'all_prompts',
        expect.any(String)
      );
      
      // 验证更新的提示词列表不包含已删除的提示词
      const allPromptsCall = mockKV.put.mock.calls.find(call => call[0] === 'all_prompts');
      const updatedPrompts = JSON.parse(allPromptsCall[1]);
      expect(updatedPrompts.length).toBe(1);
      expect(updatedPrompts[0].name).toBe('test_prompt_2');
    });

    it('should return false when deleting non-existent prompt', async () => {
      // 模拟当前已加载的提示词
      mockKV.get.mockImplementation((key) => {
        if (key === 'all_prompts') {
          return Promise.resolve(JSON.stringify(samplePrompts));
        } else if (key === 'prompt:non_existent') {
          return Promise.resolve(null); // 不存在
        }
        return Promise.resolve(null);
      });
      
      const result = await kvStorage.deletePrompt('non_existent');
      
      expect(result).toBe(false);
      // 验证没有删除任何内容
      expect(mockKV.delete).not.toHaveBeenCalled();
      // 验证没有更新提示词列表
      expect(mockKV.put).not.toHaveBeenCalled();
    });
  });
});
