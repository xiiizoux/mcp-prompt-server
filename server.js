/**
 * MCP Prompt Server - 服务器入口文件
 */
// 加载环境变量
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { initializeAdapter, handleApiRequest } = require('./src/api-adapter');

// 加载配置
const config = require('./src/config').getConfig();

// 创建 Express 应用
const app = express();
const PORT = config.server.port || process.env.PORT || 9011;

// 中间件
app.use(cors({
  // 允许所有来源的请求，以便与浏览器预览工具兼容
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept']
}));
app.use(bodyParser.json());
// 不再提供静态文件服务

// 初始化 API 适配器
initializeAdapter()
  .then(() => {
    console.log('API 适配器初始化成功');
  })
  .catch(error => {
    console.error('API 适配器初始化失败:', error);
    process.exit(1);
  });

// API 路由
// 处理所有 POST 请求
app.post('/*', async (req, res) => {
  await handleApiRequest(req, res);
});

// 处理带有 /api 前缀的 POST 请求
app.post('/api/*', async (req, res) => {
  // 移除 /api 前缀
  req.url = req.url.replace(/^\/api/, '');
  await handleApiRequest(req, res);
});

// API 文档路由
app.get('/', (req, res) => {
  res.send('MCP Prompt Server API - 使用 POST 请求访问 API 端点');
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`MCP Prompt Server 正在运行，端口: ${PORT}`);
  console.log(`使用 POST 请求访问 API 端点，例如: http://localhost:${PORT}/api/get_prompt_names`);
});
