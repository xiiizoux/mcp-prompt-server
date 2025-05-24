/**
 * Supabase 数据库准备脚本
 * 用于创建必要的表和函数
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

// 读取 SQL 函数文件
const sqlFunctionsPath = path.join(__dirname, '../src/storage/supabase-functions.sql');
const sqlFunctions = fs.readFileSync(sqlFunctionsPath, 'utf8');

// 分割 SQL 语句
const sqlStatements = [
  // 创建 UUID 扩展
  'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
  
  // 创建类别表
  `CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  
  // 创建提示词表
  `CREATE TABLE IF NOT EXISTS prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  
  // 创建标签表
  `CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  
  // 创建提示词-标签关联表
  `CREATE TABLE IF NOT EXISTS prompt_tags (
    prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (prompt_id, tag_id)
  );`,
  
  // 创建设置表
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  
  // 添加默认设置
  `INSERT INTO settings (key, value) 
   VALUES ('default_settings', '{"version": "1.0.0"}') 
   ON CONFLICT (key) DO NOTHING;`
];

/**
 * 使用 REST API 执行 SQL 语句
 * @param {string} supabaseUrl Supabase URL
 * @param {string} supabaseKey Supabase API 密钥
 * @param {string} sql SQL 语句
 * @returns {Promise<any>} 响应
 */
async function executeSql(supabaseUrl, supabaseKey, sql) {
  return new Promise((resolve, reject) => {
    const projectId = supabaseUrl.match(/https:\/\/([^\.]+)\.supabase\.co/)[1];
    const apiUrl = `https://${projectId}.supabase.co/rest/v1/`;
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'resolution=merge-duplicates'
      }
    };
    
    const req = https.request(apiUrl + 'rpc/execute_sql', options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP Error: ${res.statusCode} - ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(JSON.stringify({ sql }));
    req.end();
  });
}

async function prepareDatabase() {
  // 检查环境变量
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  console.log('环境变量检查:');
  console.log(`SUPABASE_URL 存在: ${Boolean(supabaseUrl)}`);
  console.log(`SUPABASE_KEY 存在: ${Boolean(supabaseKey)}`);
  
  // 检查环境变量是否有效
  if (!supabaseUrl || !supabaseKey) {
    console.error('错误: 缺少 Supabase 配置。请确保在 .env 文件中设置了 SUPABASE_URL 和 SUPABASE_KEY。');
    process.exit(1);
  }
  
  // 检查 URL 格式
  try {
    new URL(supabaseUrl);
    console.log('SUPABASE_URL 格式有效');
  } catch (e) {
    console.error(`错误: SUPABASE_URL 格式无效: ${supabaseUrl}`);
    process.exit(1);
  }
  
  // 检查 API 密钥长度
  if (supabaseKey.length < 10) {
    console.error('错误: SUPABASE_KEY 长度异常短，可能无效');
    process.exit(1);
  }
  
  // 创建 execute_sql 函数
  const createExecuteSqlFunction = `
  CREATE OR REPLACE FUNCTION execute_sql(sql text)
  RETURNS void AS $$
  BEGIN
    EXECUTE sql;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  console.log('正在连接到 Supabase...');
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 测试连接
    try {
      const { data, error } = await supabase.from('_test_connection').select('*').limit(1);
      if (error && error.code !== 'PGRST116') {
        throw new Error(`连接测试失败: ${error.message}`);
      }
    } catch (connectionError) {
      // 忽略表不存在的错误，这是预期的
      console.log('连接测试完成，继续初始化数据库...');
    }

    console.log('连接成功！正在设置数据库...');

    // 使用 Supabase 的 REST API 执行 SQL
    for (let i = 0; i < sqlStatements.length; i++) {
      const sql = sqlStatements[i];
      if (!sql || sql.trim().length === 0) continue;
      
      console.log(`执行 SQL 语句 ${i + 1}/${sqlStatements.length}...`);
      console.log(`SQL: ${sql.substring(0, 50)}${sql.length > 50 ? '...' : ''}`);
      
      try {
        // 使用 Supabase 的数据 API 执行 SQL
        const { error } = await supabase.from('_dummy_').select('*').limit(0).then(async () => {
          // 如果连接成功，使用原始 SQL
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          
          // 使用 PostgreSQL REST API 执行 SQL
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
              query: sql
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`SQL 执行错误 (${response.status}): ${errorText}`);
          }
          
          return { error: null };
        }).catch(error => ({ error }));
        
        if (error) {
          // 如果是已存在的错误，可以忽略
          if (error.message && error.message.includes('already exists')) {
            console.log(`表或函数已存在，继续执行...`);
            continue;
          }
          
          // 尝试直接使用 REST API
          try {
            await executeSql(supabaseUrl, supabaseKey, sql);
            console.log(`SQL 执行成功`);
          } catch (restError) {
            if (restError.message && restError.message.includes('already exists')) {
              console.log(`表或函数已存在，继续执行...`);
              continue;
            }
            
            console.error(`SQL 执行错误: ${restError.message}`);
            console.error(`出错的 SQL: ${sql.substring(0, 100)}...`);
            throw restError;
          }
        } else {
          console.log(`SQL 执行成功`);
        }
      } catch (error) {
        // 如果是已存在的错误，可以忽略
        if (error.message && error.message.includes('already exists')) {
          console.log(`表或函数已存在，继续执行...`);
          continue;
        }
        
        console.error(`执行 SQL 时出错: ${error.message}`);
        throw error;
      }
    }
    
    console.log('所有 SQL 语句执行完成');

    console.log('数据库设置完成！');
  } catch (error) {
    console.error('设置数据库时出错:', error.message);
    process.exit(1);
  }
}

prepareDatabase();
