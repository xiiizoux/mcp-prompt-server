import { createStore } from 'vuex';
import promptsModule from './modules/prompts';
import categoriesModule from './modules/categories';
import tagsModule from './modules/tags';
import settingsModule from './modules/settings';

export default createStore({
  state: {
    loading: false,
    error: null,
    notification: null
  },
  mutations: {
    SET_LOADING(state, loading) {
      state.loading = loading;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
    SET_NOTIFICATION(state, notification) {
      state.notification = notification;
    },
    CLEAR_NOTIFICATION(state) {
      state.notification = null;
    }
  },
  actions: {
    setLoading({ commit }, loading) {
      commit('SET_LOADING', loading);
    },
    setError({ commit }, error) {
      commit('SET_ERROR', error);
    },
    showNotification({ commit }, { type, message, duration = 3000 }) {
      commit('SET_NOTIFICATION', { type, message });
      setTimeout(() => {
        commit('CLEAR_NOTIFICATION');
      }, duration);
    }
  },
  getters: {
    isLoading: state => state.loading,
    error: state => state.error,
    notification: state => state.notification
  },
  modules: {
    prompts: promptsModule,
    categories: categoriesModule,
    tags: tagsModule,
    settings: settingsModule
  }
});
