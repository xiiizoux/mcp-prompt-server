import { PromptService } from '../../src/core/prompt-service.js';
import { StorageInterface } from '../../src/storage/storage-interface.js';
import { LoadedPrompt, PromptCategory, PromptTag } from '../../src/types.js';

// 创建一个模拟的存储接口
class MockStorage implements StorageInterface {
  private prompts: LoadedPrompt[] = [];

  constructor(initialPrompts: LoadedPrompt[] = []) {
    this.prompts = [...initialPrompts];
  }

  async initialize(): Promise<void> {
    // 模拟初始化
    return Promise.resolve();
  }

  async loadAllPrompts(): Promise<LoadedPrompt[]> {
    return Promise.resolve([...this.prompts]);
  }

  async addPrompt(prompt: LoadedPrompt): Promise<boolean> {
    if (this.prompts.some(p => p.name === prompt.name)) {
      return Promise.resolve(false);
    }
    this.prompts.push(prompt);
    return Promise.resolve(true);
  }

  async updatePrompt(name: string, updatedPrompt: LoadedPrompt): Promise<boolean> {
    const index = this.prompts.findIndex(p => p.name === name);
    if (index === -1) {
      return Promise.resolve(false);
    }
    this.prompts[index] = updatedPrompt;
    return Promise.resolve(true);
  }

  async deletePrompt(name: string): Promise<boolean> {
    const initialLength = this.prompts.length;
    this.prompts = this.prompts.filter(p => p.name !== name);
    return Promise.resolve(this.prompts.length < initialLength);
  }
}

describe('PromptService', () => {
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
    },
    {
      name: 'production_prompt',
      description: 'A production prompt',
      parameters: [],
      messages: [{ role: 'system', content: 'You are a production assistant' }],
      tags: ['production'] as PromptTag[],
      category: 'production' as PromptCategory
    }
  ];

  let mockStorage: MockStorage;
  let promptService: PromptService;

  beforeEach(async () => {
    // 为每个测试创建新的模拟存储和服务实例
    mockStorage = new MockStorage(samplePrompts);
    promptService = new PromptService(mockStorage);
    await promptService.initialize();
  });

  describe('initialize', () => {
    it('should load all prompts from storage', async () => {
      expect(promptService.getLoadedPrompts().length).toBe(samplePrompts.length);
    });
  });

  describe('getPromptNames', () => {
    it('should return all prompt names', () => {
      const names = promptService.getPromptNames();
      expect(names).toContain('test_prompt_1');
      expect(names).toContain('test_prompt_2');
      expect(names).toContain('production_prompt');
      expect(names.length).toBe(3);
    });
  });

  describe('searchPrompts', () => {
    it('should find prompts by keyword', async () => {
      const result = await promptService.searchPrompts('test');
      expect(result.prompts.length).toBe(2);
      expect(result.total).toBe(2);
    });

    it('should find prompts by category', async () => {
      const result = await promptService.searchPrompts('', 'testing' as PromptCategory);
      expect(result.prompts.length).toBe(1);
      expect(result.prompts[0].name).toBe('test_prompt_1');
    });

    it('should find prompts by tags', async () => {
      const result = await promptService.searchPrompts('', undefined, ['advanced'] as PromptTag[]);
      expect(result.prompts.length).toBe(1);
      expect(result.prompts[0].name).toBe('test_prompt_2');
    });

    it('should support pagination', async () => {
      const result = await promptService.searchPrompts('', undefined, undefined, 1, 1);
      expect(result.prompts.length).toBe(1);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(1);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('getPromptDetails', () => {
    it('should return details for a specific prompt', async () => {
      const details = await promptService.getPromptDetails('test_prompt_2');
      expect(details).not.toBeNull();
      expect(details?.name).toBe('test_prompt_2');
      expect(details?.parameters.length).toBe(1);
      expect(details?.parameters[0].name).toBe('param1');
    });

    it('should return null for non-existent prompt', async () => {
      const details = await promptService.getPromptDetails('non_existent');
      expect(details).toBeNull();
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

      const result = await promptService.addPrompt(newPrompt);
      expect(result).toBe(true);
      
      const names = promptService.getPromptNames();
      expect(names).toContain('new_prompt');
      expect(names.length).toBe(4);
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

      const result = await promptService.addPrompt(duplicatePrompt);
      expect(result).toBe(false);
      
      const names = promptService.getPromptNames();
      expect(names.length).toBe(3); // 数量未变
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

      const result = await promptService.updatePrompt('test_prompt_1', updatedPrompt);
      expect(result).toBe(true);
      
      const details = await promptService.getPromptDetails('test_prompt_1');
      expect(details?.description).toBe('Updated description');
      expect(details?.tags).toContain('updated');
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

      const result = await promptService.updatePrompt('non_existent', updatedPrompt);
      expect(result).toBe(false);
    });
  });

  describe('deletePrompt', () => {
    it('should delete an existing prompt', async () => {
      const result = await promptService.deletePrompt('test_prompt_1');
      expect(result).toBe(true);
      
      const names = promptService.getPromptNames();
      expect(names).not.toContain('test_prompt_1');
      expect(names.length).toBe(2);
    });

    it('should return false when deleting non-existent prompt', async () => {
      const result = await promptService.deletePrompt('non_existent');
      expect(result).toBe(false);
      
      const names = promptService.getPromptNames();
      expect(names.length).toBe(3); // 数量未变
    });
  });
});
