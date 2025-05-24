import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// 加载根目录的 .env 文件
const envPath = path.resolve(__dirname, '../.env');
let FRONTEND_PORT = 9010;
let BACKEND_PORT = 9011;

if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  FRONTEND_PORT = parseInt(envConfig.FRONTEND_PORT || '9010', 10);
  BACKEND_PORT = parseInt(envConfig.PORT || '9011', 10);
  console.log(`从 .env 文件读取配置: 前端端口=${FRONTEND_PORT}, 后端端口=${BACKEND_PORT}`);
} else {
  console.log(`未找到 .env 文件，使用默认配置: 前端端口=${FRONTEND_PORT}, 后端端口=${BACKEND_PORT}`);
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: FRONTEND_PORT,
    proxy: {
      '/api': {
        target: `http://localhost:${BACKEND_PORT}`,
        changeOrigin: true,
        // 移除 /api 前缀，以便与后端服务器的路由匹配
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: '../public',
    emptyOutDir: true
  },
  // 将环境变量暴露给前端代码
  define: {
    'process.env.FRONTEND_PORT': JSON.stringify(FRONTEND_PORT),
    'process.env.BACKEND_PORT': JSON.stringify(BACKEND_PORT)
  }
});
