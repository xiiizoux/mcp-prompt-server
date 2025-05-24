import api from '@/api/categories';

export default {
  namespaced: true,
  state: {
    categories: [],
    categoryStats: {}
  },
  mutations: {
    SET_CATEGORIES(state, categories) {
      state.categories = categories;
    },
    SET_CATEGORY_STATS(state, stats) {
      state.categoryStats = stats;
    },
    ADD_CATEGORY(state, category) {
      if (!state.categories.includes(category)) {
        state.categories.push(category);
      }
    },
    UPDATE_CATEGORY(state, { oldName, newName }) {
      const index = state.categories.findIndex(c => c === oldName);
      if (index !== -1) {
        state.categories.splice(index, 1, newName);
      }
      
      // 更新统计信息
      if (state.categoryStats[oldName]) {
        state.categoryStats[newName] = state.categoryStats[oldName];
        delete state.categoryStats[oldName];
      }
    },
    DELETE_CATEGORY(state, categoryName) {
      state.categories = state.categories.filter(c => c !== categoryName);
      
      // 更新统计信息
      if (state.categoryStats[categoryName]) {
        delete state.categoryStats[categoryName];
      }
    }
  },
  actions: {
    async getAllCategories({ commit }) {
      try {
        const categories = await api.getAllCategories();
        commit('SET_CATEGORIES', categories);
        return categories;
      } catch (error) {
        console.error('Error getting categories:', error);
        throw error;
      }
    },
    async getCategoryStats({ commit }) {
      try {
        const stats = await api.getCategoryStats();
        commit('SET_CATEGORY_STATS', stats);
        return stats;
      } catch (error) {
        console.error('Error getting category stats:', error);
        throw error;
      }
    },
    async addCategory({ commit }, categoryName) {
      try {
        const result = await api.addCategory(categoryName);
        if (result) {
          commit('ADD_CATEGORY', categoryName);
        }
        return result;
      } catch (error) {
        console.error(`Error adding category ${categoryName}:`, error);
        throw error;
      }
    },
    async updateCategory({ commit }, { oldName, newName }) {
      try {
        const result = await api.updateCategory(oldName, newName);
        if (result) {
          commit('UPDATE_CATEGORY', { oldName, newName });
        }
        return result;
      } catch (error) {
        console.error(`Error updating category ${oldName} to ${newName}:`, error);
        throw error;
      }
    },
    async deleteCategory({ commit }, categoryName) {
      try {
        const result = await api.deleteCategory(categoryName);
        if (result) {
          commit('DELETE_CATEGORY', categoryName);
        }
        return result;
      } catch (error) {
        console.error(`Error deleting category ${categoryName}:`, error);
        throw error;
      }
    }
  },
  getters: {
    allCategories: state => state.categories,
    categoryStats: state => state.categoryStats,
    categoriesWithCount: state => {
      return state.categories.map(category => ({
        name: category,
        count: state.categoryStats[category] || 0
      }));
    }
  }
};
