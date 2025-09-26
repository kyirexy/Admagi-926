-- 万相营造 AI电商平台数据库表结构
-- 执行方式：在PostgreSQL管理工具中直接执行此脚本
-- 或使用命令: psql -h localhost -p 5432 -U postgres -d admagic -f create_tables.sql

-- 用户表
CREATE TABLE IF NOT EXISTS "user" (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    username VARCHAR(255) UNIQUE,
    email_verified BOOLEAN DEFAULT FALSE,
    image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- 扩展字段
    credits INTEGER DEFAULT 100,
    is_premium BOOLEAN DEFAULT FALSE,
    avatar TEXT
);

-- 会话表
CREATE TABLE IF NOT EXISTS "session" (
    id VARCHAR(255) PRIMARY KEY,
    expires_at TIMESTAMP NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(255),
    user_agent TEXT,
    user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

-- 账户表（用于OAuth和密码认证）
CREATE TABLE IF NOT EXISTS "account" (
    id SERIAL PRIMARY KEY,
    account_id VARCHAR(255) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    access_token_expires_at TIMESTAMP,
    refresh_token_expires_at TIMESTAMP,
    scope TEXT,
    password TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider_id, account_id)
);

-- 验证表（邮箱验证、密码重置等）
CREATE TABLE IF NOT EXISTS "verification" (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI生成记录表
CREATE TABLE IF NOT EXISTS "ai_generation" (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'image', 'text', 'page', 'video'
    prompt TEXT NOT NULL,
    parameters JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    cost_credits INTEGER NOT NULL,
    result_data JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- 商品分类表
CREATE TABLE IF NOT EXISTS "category" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 商品表
CREATE TABLE IF NOT EXISTS "product" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    category_id INTEGER NOT NULL REFERENCES "category"(id),
    image_urls JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    stock INTEGER DEFAULT 0,
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 订单表
CREATE TABLE IF NOT EXISTS "order" (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'
    payment_method VARCHAR(100),
    payment_id VARCHAR(255),
    shipping_address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP
);

-- 订单项表
CREATE TABLE IF NOT EXISTS "order_item" (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES "product"(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
CREATE INDEX IF NOT EXISTS idx_user_username ON "user"(username);
CREATE INDEX IF NOT EXISTS idx_session_user_id ON "session"(user_id);
CREATE INDEX IF NOT EXISTS idx_session_token ON "session"(token);
CREATE INDEX IF NOT EXISTS idx_account_user_id ON "account"(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_user_id ON "ai_generation"(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_status ON "ai_generation"(status);
CREATE INDEX IF NOT EXISTS idx_product_category_id ON "product"(category_id);
CREATE INDEX IF NOT EXISTS idx_order_user_id ON "order"(user_id);
CREATE INDEX IF NOT EXISTS idx_order_item_order_id ON "order_item"(order_id);

-- 插入示例分类
INSERT INTO "category" (name, description) VALUES 
('AI工具', 'AI相关工具和服务'),
('设计素材', '设计模板和素材资源'),
('教程课程', 'AI使用教程和培训课程')
ON CONFLICT (name) DO NOTHING;

-- 插入示例商品
INSERT INTO "product" (name, description, price, category_id, stock) 
SELECT 'AI图片生成服务', '高质量AI图片生成，支持多种风格', 9.99, c.id, 1000
FROM "category" c WHERE c.name = 'AI工具'
ON CONFLICT DO NOTHING;

INSERT INTO "product" (name, description, price, category_id, stock) 
SELECT 'AI文案生成包', '智能营销文案生成服务', 19.99, c.id, 500
FROM "category" c WHERE c.name = 'AI工具'
ON CONFLICT DO NOTHING;

INSERT INTO "product" (name, description, price, category_id, stock) 
SELECT '设计模板套装', '精美设计模板集合', 29.99, c.id, 100
FROM "category" c WHERE c.name = '设计素材'
ON CONFLICT DO NOTHING;

INSERT INTO "product" (name, description, price, category_id, stock) 
SELECT 'AI工具使用教程', '从入门到精通的完整教程', 49.99, c.id, 200
FROM "category" c WHERE c.name = '教程课程'
ON CONFLICT DO NOTHING;

-- 创建测试用户
INSERT INTO "user" (email, name, username, credits, is_premium) VALUES
('admin@admagic.com', '管理员', 'admin', 10000, true),
('user@admagic.com', '测试用户', 'testuser', 100, false)
ON CONFLICT (email) DO NOTHING;

-- 为测试用户创建账户（简化的密码：123456）
INSERT INTO "account" (account_id, provider_id, user_id, password, created_at, updated_at)
SELECT u.email, 'credential', u.id, '123456', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "user" u 
WHERE u.email IN ('admin@admagic.com', 'user@admagic.com')
ON CONFLICT (provider_id, account_id) DO NOTHING;

-- 显示创建结果
SELECT 
    'Tables created successfully!' as message,
    (SELECT COUNT(*) FROM "user") as users,
    (SELECT COUNT(*) FROM "category") as categories,
    (SELECT COUNT(*) FROM "product") as products;
