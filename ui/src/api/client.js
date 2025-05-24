import axios from 'axios';
import store from '@/store';

// 创建 axios 实例
const apiClient = axios.create({
  // 使用相对路径，这样请求会通过浏览器预览工具的代理转发
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 请求拦截器
apiClient.interceptors.request.use(
  config => {
    // 在请求发送前做一些处理
    store.dispatch('setLoading', true);
    
    // 保持原始的 baseURL
    return config;
  },
  error => {
    // 处理请求错误
    store.dispatch('setLoading', false);
    store.dispatch('setError', error.message);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  response => {
    // 处理响应数据
    store.dispatch('setLoading', false);
    return response.data;
  },
  error => {
    // 处理响应错误
    store.dispatch('setLoading', false);
    
    let errorMessage = '请求失败';
    if (error.response) {
      // 服务器返回了错误状态码
      const { status, data } = error.response;
      errorMessage = data.error?.message || `请求失败: ${status}`;
    } else if (error.request) {
      // 请求已发送但没有收到响应
      errorMessage = '服务器无响应';
    } else {
      // 请求配置出错
      errorMessage = error.message;
    }
    
    store.dispatch('setError', errorMessage);
    store.dispatch('showNotification', {
      type: 'error',
      message: errorMessage
    });
    
    return Promise.reject(error);
  }
);

export default apiClient;
