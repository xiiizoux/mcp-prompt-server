import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageInterface } from './storage-interface.js';
import { LoadedPrompt } from '../types.js';
import { StorageError, logger } from '../utils/error-handler.js';

/**
 * Supabase 存储实现
 * 使用 Supabase PostgreSQL 数据库作为存储后端
 */
export class SupabaseStorage implements IStorage {
  private client: SupabaseClient;
  private logger: Logger;

  /**
   * 构造函数
   * @param supabaseUrl Supabase URL
   * @param supabaseKey Supabase API Key
   */
  constructor(supabaseUrl: string, supabaseKey: string) {
    this.client = createClient(supabaseUrl, supabaseKey);
    this.logger = new Logger('SupabaseStorage');
  }

  /**
   * 初始化存储
   * 创建必要的表和索引
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('初始化 Supabase 存储...');
      
      // 检查表是否存在，如果不存在则创建
      await this.createTablesIfNotExist();
      
      this.logger.info('Supabase 存储初始化完成');
      return Promise.resolve();
    } catch (error) {
      this.logger.error('初始化 Supabase 存储失败', error);
      return Promise.reject(error);
    }
  }

  /**
   * 获取提示词
   * @param name 提示词名称
   */
  async getPrompt(name: string): Promise<any> {
    try {
      this.logger.debug(`获取提示词: ${name}`);
      
      // 查询提示词
      const { data: prompt, error: promptError } = await this.client
        .from('prompts')
        .select('*')
        .eq('name', name)
        .single();
      
      if (promptError) throw promptError;
      if (!prompt) return null;
      
      // 查询提示词关联的标签
      const { data: promptTags, error: tagsError } = await this.client
        .from('prompt_tags')
        .select('tags(name)')
        .eq('prompt_id', prompt.id);
      
      if (tagsError) throw tagsError;
      
      // 转换为应用格式
      const formattedPrompt = {
        ...prompt,
        tags: promptTags ? promptTags.map(pt => pt.tags.name) : []
      };
      
      return formattedPrompt;
    } catch (error) {
      ErrorHandler.handleError('获取提示词失败', error);
      throw error;
    }
  }

  /**
   * 获取所有提示词
   */
  async getAllPrompts(): Promise<any[]> {
    try {
      this.logger.debug('获取所有提示词');
      
      // 查询所有提示词
      const { data: prompts, error: promptsError } = await this.client
        .from('prompts')
        .select('*')
        .order('name');
      
      if (promptsError) throw promptsError;
      if (!prompts || prompts.length === 0) return [];
      
      // 查询所有提示词的标签
      const promptsWithTags = await Promise.all(
        prompts.map(async (prompt) => {
          const { data: promptTags, error: tagsError } = await this.client
            .from('prompt_tags')
            .select('tags(name)')
            .eq('prompt_id', prompt.id);
          
          if (tagsError) throw tagsError;
          
          return {
            ...prompt,
            tags: promptTags ? promptTags.map(pt => pt.tags.name) : []
          };
        })
      );
      
      return promptsWithTags;
    } catch (error) {
      ErrorHandler.handleError('获取所有提示词失败', error);
      throw error;
    }
  }

  /**
   * 保存提示词
   * @param name 提示词名称
   * @param prompt 提示词数据
   */
  async savePrompt(name: string, prompt: any): Promise<void> {
    try {
      this.logger.debug(`保存提示词: ${name}`);
      
      // 开始事务
      const { error: txError } = await this.client.rpc('begin_transaction');
      if (txError) throw txError;
      
      try {
        // 检查提示词是否已存在
        const { data: existingPrompt } = await this.client
          .from('prompts')
          .select('id')
          .eq('name', name)
          .single();
        
        let promptId;
        
        if (existingPrompt) {
          // 更新现有提示词
          promptId = existingPrompt.id;
          const { error: updateError } = await this.client
            .from('prompts')
            .update({
              description: prompt.description,
              content: prompt.content,
              category_id: prompt.category_id,
              updated_at: new Date().toISOString()
            })
            .eq('id', promptId);
          
          if (updateError) throw updateError;
          
          // 删除现有标签关联
          const { error: deleteTagsError } = await this.client
            .from('prompt_tags')
            .delete()
            .eq('prompt_id', promptId);
          
          if (deleteTagsError) throw deleteTagsError;
        } else {
          // 插入新提示词
          const { data: newPrompt, error: insertError } = await this.client
            .from('prompts')
            .insert({
              name,
              description: prompt.description,
              content: prompt.content,
              category_id: prompt.category_id
            })
            .select('id')
            .single();
          
          if (insertError) throw insertError;
          promptId = newPrompt.id;
        }
        
        // 处理标签
        if (prompt.tags && prompt.tags.length > 0) {
          for (const tagName of prompt.tags) {
            // 获取或创建标签
            let tagId;
            const { data: existingTag } = await this.client
              .from('tags')
              .select('id')
              .eq('name', tagName)
              .single();
            
            if (existingTag) {
              tagId = existingTag.id;
            } else {
              const { data: newTag, error: tagError } = await this.client
                .from('tags')
                .insert({ name: tagName })
                .select('id')
                .single();
              
              if (tagError) throw tagError;
              tagId = newTag.id;
            }
            
            // 创建提示词-标签关联
            const { error: linkError } = await this.client
              .from('prompt_tags')
              .insert({
                prompt_id: promptId,
                tag_id: tagId
              });
            
            if (linkError) throw linkError;
          }
        }
        
        // 提交事务
        const { error: commitError } = await this.client.rpc('commit_transaction');
        if (commitError) throw commitError;
        
      } catch (error) {
        // 回滚事务
        await this.client.rpc('rollback_transaction');
        throw error;
      }
    } catch (error) {
      ErrorHandler.handleError('保存提示词失败', error);
      throw error;
    }
  }

  /**
   * 删除提示词
   * @param name 提示词名称
   */
  async deletePrompt(name: string): Promise<void> {
    try {
      this.logger.debug(`删除提示词: ${name}`);
      
      // 查询提示词 ID
      const { data: prompt, error: promptError } = await this.client
        .from('prompts')
        .select('id')
        .eq('name', name)
        .single();
      
      if (promptError) throw promptError;
      if (!prompt) {
        throw new Error(`提示词不存在: ${name}`);
      }
      
      // 删除提示词（级联删除会自动删除关联的标签）
      const { error: deleteError } = await this.client
        .from('prompts')
        .delete()
        .eq('id', prompt.id);
      
      if (deleteError) throw deleteError;
    } catch (error) {
      ErrorHandler.handleError('删除提示词失败', error);
      throw error;
    }
  }

  /**
   * 获取所有提示词名称
   */
  async getAllPromptNames(): Promise<string[]> {
    try {
      this.logger.debug('获取所有提示词名称');
      
      const { data, error } = await this.client
        .from('prompts')
        .select('name')
        .order('name');
      
      if (error) throw error;
      
      return data ? data.map(p => p.name) : [];
    } catch (error) {
      ErrorHandler.handleError('获取所有提示词名称失败', error);
      throw error;
    }
  }

  /**
   * 搜索提示词
   * @param keyword 关键词
   * @param category 类别
   * @param tags 标签数组
   */
  async searchPrompts(keyword?: string, category?: string, tags?: string[]): Promise<any[]> {
    try {
      this.logger.debug(`搜索提示词: keyword=${keyword}, category=${category}, tags=${tags}`);
      
      let query = this.client
        .from('prompts')
        .select('*');
      
      // 关键词过滤
      if (keyword) {
        query = query.or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%,content.ilike.%${keyword}%`);
      }
      
      // 类别过滤
      if (category) {
        // 先获取类别 ID
        const { data: categoryData, error: categoryError } = await this.client
          .from('categories')
          .select('id')
          .eq('name', category)
          .single();
        
        if (categoryError) throw categoryError;
        if (categoryData) {
          query = query.eq('category_id', categoryData.id);
        }
      }
      
      // 执行查询
      const { data: prompts, error: promptsError } = await query.order('name');
      
      if (promptsError) throw promptsError;
      if (!prompts || prompts.length === 0) return [];
      
      // 获取所有提示词的标签
      const promptsWithTags = await Promise.all(
        prompts.map(async (prompt) => {
          const { data: promptTags, error: tagsError } = await this.client
            .from('prompt_tags')
            .select('tags(name)')
            .eq('prompt_id', prompt.id);
          
          if (tagsError) throw tagsError;
          
          const promptWithTags = {
            ...prompt,
            tags: promptTags ? promptTags.map(pt => pt.tags.name) : []
          };
          
          return promptWithTags;
        })
      );
      
      // 标签过滤
      if (tags && tags.length > 0) {
        return promptsWithTags.filter(prompt => 
          tags.every(tag => prompt.tags.includes(tag))
        );
      }
      
      return promptsWithTags;
    } catch (error) {
      ErrorHandler.handleError('搜索提示词失败', error);
      throw error;
    }
  }

  /**
   * 创建必要的表和索引
   */
  private async createTablesIfNotExist(): Promise<void> {
    // 检查是否已存在事务函数
    const { data: txFunctions, error: txError } = await this.client
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'begin_transaction')
      .limit(1);
    
    if (!txError && (!txFunctions || txFunctions.length === 0)) {
      // 创建事务辅助函数
      await this.client.rpc('create_transaction_functions');
    }
    
    // 检查提示词表是否存在
    const { data: promptsTable, error: promptsError } = await this.client
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'prompts')
      .limit(1);
    
    if (!promptsError && (!promptsTable || promptsTable.length === 0)) {
      // 创建表结构
      await this.createDatabaseSchema();
    }
  }

  /**
   * 创建数据库架构
   */
  private async createDatabaseSchema(): Promise<void> {
    // 创建 UUID 扩展
    await this.client.rpc('create_uuid_extension');
    
    // 创建类别表
    const { error: categoriesError } = await this.client.rpc('create_categories_table');
    if (categoriesError) throw categoriesError;
    
    // 创建提示词表
    const { error: promptsError } = await this.client.rpc('create_prompts_table');
    if (promptsError) throw promptsError;
    
    // 创建标签表
    const { error: tagsError } = await this.client.rpc('create_tags_table');
    if (tagsError) throw tagsError;
    
    // 创建提示词-标签关联表
    const { error: promptTagsError } = await this.client.rpc('create_prompt_tags_table');
    if (promptTagsError) throw promptTagsError;
    
    // 创建设置表
    const { error: settingsError } = await this.client.rpc('create_settings_table');
    if (settingsError) throw settingsError;
  }
}
