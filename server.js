// 本地开发服务器
require('dotenv').config();
const app = require('./api/index');
const PORT = process.env.PORT || 9010; // 使用环境变量中的 PORT，默认为 9010

// 检查环境配置
const storageType = process.env.STORAGE_TYPE || 'file';
const forceLocalStorage = process.env.FORCE_LOCAL_STORAGE === 'true';
const useSupabase = !forceLocalStorage && 
                   storageType === 'supabase' && 
                   process.env.SUPABASE_URL && 
                   process.env.SUPABASE_ANON_KEY;

app.listen(PORT, () => {
  console.log(`MCP Prompt Server API 运行在 http://localhost:${PORT}`);
  console.log(`存储方式: ${useSupabase ? 'Supabase' : '文件系统'}`);
  console.log('可用端点:');
  console.log('- GET  /api/health');
  console.log('- POST /api/get_prompt_names');
  console.log('- POST /api/get_prompt_details');
  console.log('- POST /api/reload_prompts');
  console.log('- POST /api/get_prompt_template');
  console.log('- POST /api/create_prompt');
  
  if (useSupabase) {
    console.log('- POST /api/auth/login');
    console.log('- POST /api/auth/register');
    console.log('- POST /api/auth/logout');
  }
});
