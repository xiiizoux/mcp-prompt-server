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
  origin: ['http://localhost:9010', 'http://127.0.0.1:9010'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept']
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

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
app.post('/*', async (req, res) => {
  await handleApiRequest(req, res);
});

// 前端路由 - 将所有其他请求重定向到 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`MCP Prompt Server 正在运行，端口: ${PORT}`);
  console.log(`访问 http://localhost:${PORT} 使用 Web UI`);
});
