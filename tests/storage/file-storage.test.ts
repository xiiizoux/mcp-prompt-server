import fs from 'fs-extra';
import path from 'path';
import { FileStorage } from '../../src/storage/file-storage.js';
import { LoadedPrompt, PromptCategory, PromptTag } from '../../src/types.js';

// 模拟 fs-extra
jest.mock('fs-extra', () => ({
  ensureDir: jest.fn().mockResolvedValue(undefined),
  pathExists: jest.fn().mockResolvedValue(true),
  readdir: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn().mockResolvedValue(undefined)
}));

describe('FileStorage', () => {
  const testPromptsDir = '/test/prompts';
  const testPromptsFile = 'prompts.json';
  
  let fileStorage: FileStorage;
  
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
    
    // 创建 FileStorage 实例
    fileStorage = new FileStorage({
      promptsDir: testPromptsDir,
      promptsFile: testPromptsFile
    });
    
    // 模拟文件系统操作
    (fs.readdir as jest.Mock).mockResolvedValue([
      'test_prompt_1.yaml',
      'test_prompt_2.yaml',
      'not_a_prompt.txt' // 应该被忽略
    ]);
    
    // 模拟读取文件内容
    (fs.readFile as jest.Mock).mockImplementation((filePath) => {
      if (filePath.includes('test_prompt_1')) {
        return Promise.resolve(`
name: test_prompt_1
description: Test prompt 1
tags:
  - test
  - sample
category: testing
messages:
  - role: system
    content: You are a test assistant
parameters: []
        `);
      } else if (filePath.includes('test_prompt_2')) {
        return Promise.resolve(`
name: test_prompt_2
description: Test prompt 2
tags:
  - test
  - advanced
category: development
messages:
  - role: system
    content: You are another test assistant
parameters:
  - name: param1
    type: string
    description: A test parameter
        `);
      } else if (filePath.includes(testPromptsFile)) {
        // 模拟 prompts.json 文件
        return Promise.resolve(JSON.stringify(samplePrompts));
      }
      return Promise.reject(new Error('File not found'));
    });
  });

  describe('initialize', () => {
    it('should ensure the prompts directory exists', async () => {
      await fileStorage.initialize();
      expect(fs.ensureDir).toHaveBeenCalledWith(testPromptsDir);
    });
  });

  describe('loadAllPrompts', () => {
    it('should load prompts from prompts.json if it exists', async () => {
      (fs.pathExists as jest.Mock).mockResolvedValue(true);
      
      const prompts = await fileStorage.loadAllPrompts();
      
      expect(fs.pathExists).toHaveBeenCalledWith(path.join(testPromptsDir, testPromptsFile));
      expect(fs.readFile).toHaveBeenCalledWith(
        path.join(testPromptsDir, testPromptsFile),
        'utf8'
      );
      expect(prompts.length).toBe(2);
      expect(prompts[0].name).toBe('test_prompt_1');
      expect(prompts[1].name).toBe('test_prompt_2');
    });

    it('should load prompts from YAML files if prompts.json does not exist', async () => {
      // 模拟 prompts.json 不存在
      (fs.pathExists as jest.Mock).mockResolvedValueOnce(false);
      
      const prompts = await fileStorage.loadAllPrompts();
      
      expect(fs.readdir).toHaveBeenCalledWith(testPromptsDir);
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
      (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(samplePrompts));
      
      const result = await fileStorage.addPrompt(newPrompt);
      
      expect(result).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(testPromptsDir, testPromptsFile),
        expect.any(String),
        'utf8'
      );
      
      // 验证写入的内容包含新的提示词
      const writeFileCall = (fs.writeFile as jest.Mock).mock.calls[0];
      const writtenContent = JSON.parse(writeFileCall[1]);
      expect(writtenContent.length).toBe(3);
      expect(writtenContent[2].name).toBe('new_prompt');
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
      (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(samplePrompts));
      
      const result = await fileStorage.addPrompt(duplicatePrompt);
      
      expect(result).toBe(false);
      // 验证没有写入文件
      expect(fs.writeFile).not.toHaveBeenCalled();
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
      (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(samplePrompts));
      
      const result = await fileStorage.updatePrompt('test_prompt_1', updatedPrompt);
      
      expect(result).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(testPromptsDir, testPromptsFile),
        expect.any(String),
        'utf8'
      );
      
      // 验证写入的内容包含更新的提示词
      const writeFileCall = (fs.writeFile as jest.Mock).mock.calls[0];
      const writtenContent = JSON.parse(writeFileCall[1]);
      expect(writtenContent.length).toBe(2);
      expect(writtenContent[0].name).toBe('test_prompt_1');
      expect(writtenContent[0].description).toBe('Updated description');
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
      (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(samplePrompts));
      
      const result = await fileStorage.updatePrompt('non_existent', updatedPrompt);
      
      expect(result).toBe(false);
      // 验证没有写入文件
      expect(fs.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('deletePrompt', () => {
    it('should delete an existing prompt', async () => {
      // 模拟当前已加载的提示词
      (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(samplePrompts));
      
      const result = await fileStorage.deletePrompt('test_prompt_1');
      
      expect(result).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(testPromptsDir, testPromptsFile),
        expect.any(String),
        'utf8'
      );
      
      // 验证写入的内容不包含已删除的提示词
      const writeFileCall = (fs.writeFile as jest.Mock).mock.calls[0];
      const writtenContent = JSON.parse(writeFileCall[1]);
      expect(writtenContent.length).toBe(1);
      expect(writtenContent[0].name).toBe('test_prompt_2');
    });

    it('should return false when deleting non-existent prompt', async () => {
      // 模拟当前已加载的提示词
      (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(samplePrompts));
      
      const result = await fileStorage.deletePrompt('non_existent');
      
      expect(result).toBe(false);
      // 验证没有写入文件
      expect(fs.writeFile).not.toHaveBeenCalled();
    });
  });
});
