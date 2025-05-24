import apiClient from './client';

export default {
  /**
   * 获取系统设置
   * @returns {Promise} 系统设置
   */
  getSettings() {
    return apiClient.post('/get_settings', {});
  },

  /**
   * 更新系统设置
   * @param {Object} settings - 设置对象
   * @returns {Promise} 是否成功
   */
  updateSettings(settings) {
    return apiClient.post('/update_settings', { settings });
  },

  /**
   * 重置系统设置
   * @returns {Promise} 是否成功
   */
  resetSettings() {
    return apiClient.post('/reset_settings', {});
  },

  /**
   * 获取系统状态
   * @returns {Promise} 系统状态信息
   */
  getSystemStatus() {
    return apiClient.post('/get_system_status', {});
  }
};
