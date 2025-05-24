import apiClient from './client';

export default {
  /**
   * 搜索提示词
   * @param {string} keyword - 搜索关键词
   * @param {string} category - 类别筛选
   * @param {Array} tags - 标签筛选
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise} 提示词列表和分页信息
   */
  searchPrompts(keyword = '', category = '', tags = [], page = 1, pageSize = 10) {
    return apiClient.post('/search_prompts', {
      query: keyword,
      category,
      tags,
      page,
      pageSize
    });
  },

  /**
   * 获取提示词详情
   * @param {string} name - 提示词名称
   * @returns {Promise} 提示词详情
   */
  getPromptDetails(name) {
    return apiClient.post('/get_prompt_details', { name });
  },

  /**
   * 获取所有提示词名称
   * @returns {Promise} 提示词名称列表
   */
  getPromptNames() {
    return apiClient.post('/get_prompt_names', {});
  },

  /**
   * 添加新提示词
   * @param {Object} prompt - 提示词对象
   * @returns {Promise} 是否成功
   */
  addPrompt(prompt) {
    return apiClient.post('/add_new_prompt', prompt);
  },

  /**
   * 更新提示词
   * @param {string} name - 原提示词名称
   * @param {Object} updatedPrompt - 更新后的提示词对象
   * @returns {Promise} 是否成功
   */
  updatePrompt(name, updatedPrompt) {
    return apiClient.post('/update_prompt', {
      name,
      updatedPrompt
    });
  },

  /**
   * 删除提示词
   * @param {string} name - 提示词名称
   * @returns {Promise} 是否成功
   */
  deletePrompt(name) {
    return apiClient.post('/delete_prompt', { name });
  },

  /**
   * 导出提示词
   * @param {Array} names - 要导出的提示词名称数组
   * @returns {Promise} 导出的提示词数据
   */
  exportPrompts(names) {
    return apiClient.post('/export_prompts', { names });
  },

  /**
   * 导入提示词
   * @param {Array} prompts - 要导入的提示词数组
   * @returns {Promise} 导入结果
   */
  importPrompts(prompts) {
    return apiClient.post('/import_prompts', { prompts });
  },

  /**
   * 批量更新提示词
   * @param {Object} updates - 更新内容
   * @param {Array} names - 要更新的提示词名称数组
   * @returns {Promise} 更新结果
   */
  batchUpdatePrompts(updates, names) {
    return apiClient.post('/batch_update_prompts', {
      updates,
      names
    });
  }
};
