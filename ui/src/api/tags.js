import apiClient from './client';

export default {
  /**
   * 获取所有标签
   * @returns {Promise} 标签列表
   */
  getAllTags() {
    return apiClient.post('/get_all_tags', {});
  },

  /**
   * 获取标签统计信息
   * @returns {Promise} 标签统计信息
   */
  getTagStats() {
    return apiClient.post('/get_tag_stats', {});
  },

  /**
   * 添加新标签
   * @param {string} name - 标签名称
   * @returns {Promise} 是否成功
   */
  addTag(name) {
    return apiClient.post('/add_tag', { name });
  },

  /**
   * 更新标签
   * @param {string} oldName - 原标签名称
   * @param {string} newName - 新标签名称
   * @returns {Promise} 是否成功
   */
  updateTag(oldName, newName) {
    return apiClient.post('/update_tag', {
      oldName,
      newName
    });
  },

  /**
   * 删除标签
   * @param {string} name - 标签名称
   * @returns {Promise} 是否成功
   */
  deleteTag(name) {
    return apiClient.post('/delete_tag', { name });
  }
};
