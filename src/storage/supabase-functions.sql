-- 创建 UUID 扩展
CREATE OR REPLACE FUNCTION create_uuid_extension()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
END;
$$;

-- 创建事务辅助函数
CREATE OR REPLACE FUNCTION create_transaction_functions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 开始事务
  CREATE OR REPLACE FUNCTION begin_transaction()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $func$
  BEGIN
    -- 开始事务
    EXECUTE 'BEGIN';
  END;
  $func$;

  -- 提交事务
  CREATE OR REPLACE FUNCTION commit_transaction()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $func$
  BEGIN
    -- 提交事务
    EXECUTE 'COMMIT';
  END;
  $func$;

  -- 回滚事务
  CREATE OR REPLACE FUNCTION rollback_transaction()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $func$
  BEGIN
    -- 回滚事务
    EXECUTE 'ROLLBACK';
  END;
  $func$;
END;
$$;

-- 创建类别表
CREATE OR REPLACE FUNCTION create_categories_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- 创建索引
  CREATE INDEX IF NOT EXISTS idx_categories_name ON categories (name);
END;
$$;

-- 创建提示词表
CREATE OR REPLACE FUNCTION create_prompts_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- 创建索引
  CREATE INDEX IF NOT EXISTS idx_prompts_name ON prompts (name);
  CREATE INDEX IF NOT EXISTS idx_prompts_category_id ON prompts (category_id);
  
  -- 创建更新触发器
  CREATE OR REPLACE FUNCTION update_prompt_timestamp()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  
  -- 删除旧触发器（如果存在）
  DROP TRIGGER IF EXISTS update_prompt_timestamp ON prompts;
  
  -- 创建新触发器
  CREATE TRIGGER update_prompt_timestamp
  BEFORE UPDATE ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_timestamp();
END;
$$;

-- 创建标签表
CREATE OR REPLACE FUNCTION create_tags_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- 创建索引
  CREATE INDEX IF NOT EXISTS idx_tags_name ON tags (name);
END;
$$;

-- 创建提示词-标签关联表
CREATE OR REPLACE FUNCTION create_prompt_tags_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS prompt_tags (
    prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (prompt_id, tag_id)
  );
  
  -- 创建索引
  CREATE INDEX IF NOT EXISTS idx_prompt_tags_prompt_id ON prompt_tags (prompt_id);
  CREATE INDEX IF NOT EXISTS idx_prompt_tags_tag_id ON prompt_tags (tag_id);
END;
$$;

-- 创建设置表
CREATE OR REPLACE FUNCTION create_settings_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- 创建更新触发器
  CREATE OR REPLACE FUNCTION update_settings_timestamp()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  
  -- 删除旧触发器（如果存在）
  DROP TRIGGER IF EXISTS update_settings_timestamp ON settings;
  
  -- 创建新触发器
  CREATE TRIGGER update_settings_timestamp
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_timestamp();
END;
$$;

-- 添加默认设置
CREATE OR REPLACE FUNCTION add_default_settings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO settings (key, value)
  VALUES ('app_settings', '{
    "serverName": "MCP Prompt Server",
    "defaultPageSize": 10,
    "enableCache": true,
    "cacheExpiration": 300,
    "storageType": "supabase",
    "logLevel": "info",
    "enableRequestLogging": true,
    "allowImportExport": true,
    "enableVersioning": false,
    "maxVersions": 5,
    "allowBatchOperations": true
  }')
  ON CONFLICT (key) DO NOTHING;
END;
$$;
