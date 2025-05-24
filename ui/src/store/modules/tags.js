import api from '@/api/tags';

export default {
  namespaced: true,
  state: {
    tags: [],
    tagStats: {}
  },
  mutations: {
    SET_TAGS(state, tags) {
      state.tags = tags;
    },
    SET_TAG_STATS(state, stats) {
      state.tagStats = stats;
    },
    ADD_TAG(state, tag) {
      if (!state.tags.includes(tag)) {
        state.tags.push(tag);
      }
    },
    UPDATE_TAG(state, { oldName, newName }) {
      const index = state.tags.findIndex(t => t === oldName);
      if (index !== -1) {
        state.tags.splice(index, 1, newName);
      }
      
      // 更新统计信息
      if (state.tagStats[oldName]) {
        state.tagStats[newName] = state.tagStats[oldName];
        delete state.tagStats[oldName];
      }
    },
    DELETE_TAG(state, tagName) {
      state.tags = state.tags.filter(t => t !== tagName);
      
      // 更新统计信息
      if (state.tagStats[tagName]) {
        delete state.tagStats[tagName];
      }
    }
  },
  actions: {
    async getAllTags({ commit }) {
      try {
        const tags = await api.getAllTags();
        commit('SET_TAGS', tags);
        return tags;
      } catch (error) {
        console.error('Error getting tags:', error);
        throw error;
      }
    },
    async getTagStats({ commit }) {
      try {
        const stats = await api.getTagStats();
        commit('SET_TAG_STATS', stats);
        return stats;
      } catch (error) {
        console.error('Error getting tag stats:', error);
        throw error;
      }
    },
    async addTag({ commit }, tagName) {
      try {
        const result = await api.addTag(tagName);
        if (result) {
          commit('ADD_TAG', tagName);
        }
        return result;
      } catch (error) {
        console.error(`Error adding tag ${tagName}:`, error);
        throw error;
      }
    },
    async updateTag({ commit }, { oldName, newName }) {
      try {
        const result = await api.updateTag(oldName, newName);
        if (result) {
          commit('UPDATE_TAG', { oldName, newName });
        }
        return result;
      } catch (error) {
        console.error(`Error updating tag ${oldName} to ${newName}:`, error);
        throw error;
      }
    },
    async deleteTag({ commit }, tagName) {
      try {
        const result = await api.deleteTag(tagName);
        if (result) {
          commit('DELETE_TAG', tagName);
        }
        return result;
      } catch (error) {
        console.error(`Error deleting tag ${tagName}:`, error);
        throw error;
      }
    }
  },
  getters: {
    allTags: state => state.tags,
    tagStats: state => state.tagStats,
    tagsWithCount: state => {
      return state.tags.map(tag => ({
        name: tag,
        count: state.tagStats[tag] || 0
      }));
    },
    tagCloud: state => {
      const maxCount = Math.max(...Object.values(state.tagStats), 1);
      return state.tags.map(tag => ({
        name: tag,
        count: state.tagStats[tag] || 0,
        weight: ((state.tagStats[tag] || 0) / maxCount) * 5 + 1 // 1-6 范围的权重
      }));
    }
  }
};
