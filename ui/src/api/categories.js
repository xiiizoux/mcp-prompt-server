import apiClient from './client';

export default {
  /**
   * 获取所有类别
   * @returns {Promise} 类别列表
   */
  getAllCategories() {
    return apiClient.post('/get_all_categories', {});
  },

  /**
   * 获取类别统计信息
   * @returns {Promise} 类别统计信息
   */
  getCategoryStats() {
    return apiClient.post('/get_category_stats', {});
  },

  /**
   * 添加新类别
   * @param {string} name - 类别名称
   * @returns {Promise} 是否成功
   */
  addCategory(name) {
    return apiClient.post('/add_category', { name });
  },

  /**
   * 更新类别
   * @param {string} oldName - 原类别名称
   * @param {string} newName - 新类别名称
   * @returns {Promise} 是否成功
   */
  updateCategory(oldName, newName) {
    return apiClient.post('/update_category', {
      oldName,
      newName
    });
  },

  /**
   * 删除类别
   * @param {string} name - 类别名称
   * @returns {Promise} 是否成功
   */
  deleteCategory(name) {
    return apiClient.post('/delete_category', { name });
  }
};
