import { StorageFactory } from '../../src/storage/storage-factory.js';
import { FileStorage } from '../../src/storage/file-storage.js';
import { CloudflareKVStorage } from '../../src/storage/cloudflare-kv-storage.js';
import { StorageType } from '../../src/storage/storage-types.js';

// 创建一个模拟的 KV 命名空间
const mockKVNamespace = {
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  list: jest.fn()
};

// 模拟全局环境
global.self = {
  caches: {} as any
} as any;

describe('StorageFactory', () => {
  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
  });

  describe('createStorage', () => {
    it('should create FileStorage when type is FILE', () => {
      const options = {
        promptsDir: '/test/prompts',
        promptsFile: 'prompts.json'
      };
      
      const storage = StorageFactory.createStorage(StorageType.FILE, options);
      
      expect(storage).toBeInstanceOf(FileStorage);
    });

    it('should create CloudflareKVStorage when type is CLOUDFLARE_KV', () => {
      const options = {
        namespace: mockKVNamespace
      };
      
      const storage = StorageFactory.createStorage(StorageType.CLOUDFLARE_KV, options);
      
      expect(storage).toBeInstanceOf(CloudflareKVStorage);
    });

    it('should throw error for unknown storage type', () => {
      expect(() => {
        StorageFactory.createStorage('UNKNOWN' as StorageType, {});
      }).toThrow('Unsupported storage type: UNKNOWN');
    });
  });

  describe('detectAndCreateStorage', () => {
    const originalEnv = process.env;
    
    beforeEach(() => {
      // 备份原始环境变量
      process.env = { ...originalEnv };
    });
    
    afterEach(() => {
      // 恢复原始环境变量
      process.env = originalEnv;
    });

    it('should detect Cloudflare Workers environment and create CloudflareKVStorage', () => {
      // 模拟 Cloudflare Workers 环境
      global.caches = {} as any;
      
      const options = {
        namespace: mockKVNamespace
      };
      
      const storage = StorageFactory.detectAndCreateStorage(options);
      
      expect(storage).toBeInstanceOf(CloudflareKVStorage);
    });

    it('should create FileStorage by default in Node.js environment', () => {
      // 确保不是 Cloudflare Workers 环境
      delete global.caches;
      
      const options = {
        promptsDir: '/test/prompts',
        promptsFile: 'prompts.json'
      };
      
      const storage = StorageFactory.detectAndCreateStorage(options);
      
      expect(storage).toBeInstanceOf(FileStorage);
    });

    it('should respect STORAGE_TYPE environment variable', () => {
      // 设置环境变量
      process.env.STORAGE_TYPE = 'CLOUDFLARE_KV';
      
      const options = {
        namespace: mockKVNamespace
      };
      
      const storage = StorageFactory.detectAndCreateStorage(options);
      
      expect(storage).toBeInstanceOf(CloudflareKVStorage);
    });
  });
});
