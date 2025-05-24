import api from '@/api/settings';

export default {
  namespaced: true,
  state: {
    settings: {
      serverUrl: 'http://localhost:9011',
      theme: 'light',
      language: 'zh-CN',
      autoRefresh: false,
      refreshInterval: 60000,
      defaultPageSize: 10
    }
  },
  mutations: {
    SET_SETTINGS(state, settings) {
      state.settings = { ...state.settings, ...settings };
    },
    UPDATE_SETTING(state, { key, value }) {
      state.settings[key] = value;
    }
  },
  actions: {
    async getSettings({ commit, state }) {
      try {
        const settings = await api.getSettings();
        commit('SET_SETTINGS', settings);
        return settings;
      } catch (error) {
        console.error('Error getting settings:', error);
        // 如果获取失败，使用默认设置
        return state.settings;
      }
    },
    async updateSettings({ commit }, settings) {
      try {
        const result = await api.updateSettings(settings);
        if (result) {
          commit('SET_SETTINGS', settings);
        }
        return result;
      } catch (error) {
        console.error('Error updating settings:', error);
        throw error;
      }
    },
    updateSetting({ commit }, { key, value }) {
      commit('UPDATE_SETTING', { key, value });
      // 可以在这里添加本地存储逻辑
      localStorage.setItem('mcp_settings', JSON.stringify(this.state.settings.settings));
    },
    loadLocalSettings({ commit }) {
      try {
        const localSettings = localStorage.getItem('mcp_settings');
        if (localSettings) {
          commit('SET_SETTINGS', JSON.parse(localSettings));
        }
      } catch (error) {
        console.error('Error loading local settings:', error);
      }
    }
  },
  getters: {
    allSettings: state => state.settings,
    getSetting: state => key => state.settings[key]
  }
};
