/**
 * Supabase 连接验证脚本
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function verifySupabase() {
  // 获取环境变量
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  
  console.log('=== Supabase 连接验证 ===');
  console.log(`SUPABASE_URL: ${supabaseUrl ? supabaseUrl.substring(0, 15) + '...' : '未设置'}`);
  console.log(`SUPABASE_KEY: ${supabaseKey ? supabaseKey.substring(0, 5) + '...' + supabaseKey.substring(supabaseKey.length - 5) : '未设置'}`);
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('错误: 缺少 Supabase 配置');
    process.exit(1);
  }
  
  try {
    console.log('\n正在连接到 Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 获取项目信息
    console.log('获取项目信息...');
    let project, projectError;
    try {
      const result = await supabase.rpc('get_project_info');
      project = result.data;
      projectError = result.error;
    } catch (e) {
      projectError = e;
    }
    
    if (projectError) {
      console.log('无法获取项目信息，尝试列出表...');
      // 尝试列出表
      const { data: tables, error: tablesError } = await supabase
        .from('pg_catalog.pg_tables')
        .select('schemaname, tablename')
        .eq('schemaname', 'public')
        .limit(5);
      
      if (tablesError) {
        console.error('无法列出表:', tablesError.message);
      } else {
        console.log('\n数据库表:');
        if (tables && tables.length > 0) {
          tables.forEach(table => {
            console.log(`- ${table.tablename}`);
          });
        } else {
          console.log('未找到表');
        }
      }
    } else {
      console.log('\n项目信息:');
      console.log(project);
    }
    
    console.log('\n验证成功！Supabase 连接正常工作。');
  } catch (error) {
    console.error('\n验证失败:', error.message);
    process.exit(1);
  }
}

verifySupabase();
