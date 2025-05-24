/**
 * 存储模式切换脚本
 * 用于在文件存储和 Supabase 存储之间切换
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// 获取命令行参数
const args = process.argv.slice(2);
const mode = args[0]?.toLowerCase();

// 检查参数
if (!mode || (mode !== 'file' && mode !== 'supabase')) {
  console.error('请指定存储模式: file 或 supabase');
  console.error('用法: node scripts/switch-storage.js file|supabase');
  process.exit(1);
}

// 读取当前 .env 文件
const envPath = path.join(process.cwd(), '.env');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (err) {
  // 如果 .env 文件不存在，尝试从 .env.example 创建
  try {
    const exampleEnvPath = path.join(process.cwd(), '.env.example');
    envContent = fs.readFileSync(exampleEnvPath, 'utf8');
  } catch (exampleErr) {
    console.error('无法读取 .env 或 .env.example 文件');
    process.exit(1);
  }
}

// 解析 .env 内容
const envConfig = dotenv.parse(envContent);

// 更新存储模式
envConfig.STORAGE_TYPE = mode;

// 如果是本地开发模式，可以设置强制使用文件存储
if (mode === 'file') {
  envConfig.FORCE_LOCAL_STORAGE = 'true';
} else {
  envConfig.FORCE_LOCAL_STORAGE = 'false';
}

// 生成新的 .env 内容
const newEnvContent = Object.entries(envConfig)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

// 写入 .env 文件
fs.writeFileSync(envPath, newEnvContent);

console.log(`存储模式已切换为: ${mode}`);
console.log('请重新启动服务器以应用更改');
