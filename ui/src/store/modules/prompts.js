import api from '@/api/prompts';

export default {
  namespaced: true,
  state: {
    prompts: [],
    currentPrompt: null,
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
    searchKeyword: '',
    selectedCategory: '',
    selectedTags: []
  },
  mutations: {
    SET_PROMPTS(state, { prompts, total, page, pageSize, totalPages }) {
      state.prompts = prompts;
      state.total = total;
      state.page = page;
      state.pageSize = pageSize;
      state.totalPages = totalPages;
    },
    SET_CURRENT_PROMPT(state, prompt) {
      state.currentPrompt = prompt;
    },
    SET_SEARCH_PARAMS(state, { keyword, category, tags }) {
      if (keyword !== undefined) state.searchKeyword = keyword;
      if (category !== undefined) state.selectedCategory = category;
      if (tags !== undefined) state.selectedTags = tags;
    },
    RESET_SEARCH_PARAMS(state) {
      state.searchKeyword = '';
      state.selectedCategory = '';
      state.selectedTags = [];
    },
    ADD_PROMPT(state, prompt) {
      state.prompts.unshift(prompt);
    },
    UPDATE_PROMPT(state, updatedPrompt) {
      const index = state.prompts.findIndex(p => p.name === updatedPrompt.name);
      if (index !== -1) {
        state.prompts.splice(index, 1, updatedPrompt);
      }
      if (state.currentPrompt && state.currentPrompt.name === updatedPrompt.name) {
        state.currentPrompt = updatedPrompt;
      }
    },
    DELETE_PROMPT(state, promptName) {
      state.prompts = state.prompts.filter(p => p.name !== promptName);
      if (state.currentPrompt && state.currentPrompt.name === promptName) {
        state.currentPrompt = null;
      }
    }
  },
  actions: {
    async searchPrompts({ commit, state }, { keyword, category, tags, page, pageSize } = {}) {
      try {
        commit('SET_SEARCH_PARAMS', { 
          keyword: keyword !== undefined ? keyword : state.searchKeyword,
          category: category !== undefined ? category : state.selectedCategory,
          tags: tags !== undefined ? tags : state.selectedTags
        });
        
        const currentPage = page || state.page;
        const currentPageSize = pageSize || state.pageSize;
        
        const response = await api.searchPrompts(
          state.searchKeyword,
          state.selectedCategory,
          state.selectedTags,
          currentPage,
          currentPageSize
        );
        
        commit('SET_PROMPTS', {
          prompts: response.prompts,
          total: response.total,
          page: response.page,
          pageSize: response.pageSize,
          totalPages: response.totalPages
        });
        
        return response;
      } catch (error) {
        console.error('Error searching prompts:', error);
        throw error;
      }
    },
    async getPromptDetails({ commit }, promptName) {
      try {
        const prompt = await api.getPromptDetails(promptName);
        commit('SET_CURRENT_PROMPT', prompt);
        return prompt;
      } catch (error) {
        console.error(`Error getting prompt details for ${promptName}:`, error);
        throw error;
      }
    },
    async addPrompt({ commit, dispatch }, promptData) {
      try {
        const result = await api.addPrompt(promptData);
        if (result) {
          commit('ADD_PROMPT', promptData);
          dispatch('searchPrompts', { page: 1 }); // 刷新列表
        }
        return result;
      } catch (error) {
        console.error('Error adding prompt:', error);
        throw error;
      }
    },
    async updatePrompt({ commit }, { name, updatedPrompt }) {
      try {
        const result = await api.updatePrompt(name, updatedPrompt);
        if (result) {
          commit('UPDATE_PROMPT', updatedPrompt);
        }
        return result;
      } catch (error) {
        console.error(`Error updating prompt ${name}:`, error);
        throw error;
      }
    },
    async deletePrompt({ commit }, promptName) {
      try {
        const result = await api.deletePrompt(promptName);
        if (result) {
          commit('DELETE_PROMPT', promptName);
        }
        return result;
      } catch (error) {
        console.error(`Error deleting prompt ${promptName}:`, error);
        throw error;
      }
    },
    resetSearchParams({ commit }) {
      commit('RESET_SEARCH_PARAMS');
    }
  },
  getters: {
    allPrompts: state => state.prompts,
    currentPrompt: state => state.currentPrompt,
    pagination: state => ({
      total: state.total,
      page: state.page,
      pageSize: state.pageSize,
      totalPages: state.totalPages
    }),
    searchParams: state => ({
      keyword: state.searchKeyword,
      category: state.selectedCategory,
      tags: state.selectedTags
    })
  }
};
