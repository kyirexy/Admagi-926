# 迁移到 Better Auth 完整方案

## 🎯 迁移目标
将现有的 FastAPI + 自定义认证 迁移到 Better Auth 标准实现

## 📋 迁移步骤

### 1. 后端迁移（Node.js + Better Auth）

#### 安装依赖
```bash
npm install better-auth
npm install pg  # PostgreSQL支持
```

#### 创建 Better Auth 配置
```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { Pool } from "pg";

const pool = new Pool({
    host: "localhost",
    port: 5432,
    database: "admagic",
    user: "postgres", 
    password: "123456"
});

export const auth = betterAuth({
    database: pool,
    emailAndPassword: {
        enabled: true,
        autoSignIn: true, // 注册后自动登录
        requireEmailVerification: false, // 开发环境
        minPasswordLength: 6,
        maxPasswordLength: 128,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7天
        updateAge: 60 * 60 * 24,     // 1天更新一次
    },
    trustedOrigins: ["http://localhost:3000"],
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:8000",
});
```

#### API路由处理
```typescript
// pages/api/auth/[...better-auth].ts (Next.js)
import { auth } from "@/lib/auth";

export { auth as GET, auth as POST };
```

### 2. 前端迁移（标准Better Auth客户端）

#### 安装客户端
```bash
npm install better-auth
```

#### 更新客户端配置
```typescript
// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: "http://localhost:8000"
});

export const { signUp, signIn, signOut, useSession } = authClient;
```

#### 更新注册组件
```typescript
// 标准Better Auth用法
const { data, error } = await authClient.signUp.email({
    email: formData.email,
    password: formData.password,
    name: formData.name,
    callbackURL: "/"
}, {
    onSuccess: (ctx) => {
        refetch();
        router.push('/');
    },
    onError: (ctx) => {
        setError(ctx.error.message);
    }
});
```

### 3. 数据库迁移

#### 自动生成表结构
```bash
npx @better-auth/cli generate
```

#### 数据迁移脚本
```sql
-- 迁移现有用户数据到Better Auth格式
INSERT INTO user (id, email, name, emailVerified, image, createdAt, updatedAt)
SELECT id, email, name, "emailVerified", image, "createdAt", "updatedAt"
FROM "user";

-- 迁移账户数据
INSERT INTO account (id, userId, accountId, providerId, password, createdAt, updatedAt)
SELECT gen_random_uuid(), user_id, email, 'credential', password_hash, created_at, updated_at
FROM existing_accounts;
```

### 4. 邮件服务集成

```typescript
// 在Better Auth配置中添加邮件服务
export const auth = betterAuth({
    // ... 其他配置
    emailVerification: {
        sendVerificationEmail: async (user, url) => {
            await emailService.send({
                to: user.email,
                subject: "验证您的邮箱",
                html: verificationEmailTemplate(user.name, url)
            });
        }
    }
});
```

## ⚡ 迁移优势

### 功能完整性
- ✅ 标准化的认证API
- ✅ 内置邮箱验证
- ✅ 社交登录支持
- ✅ 插件生态系统
- ✅ 自动数据库迁移
- ✅ 多框架支持

### 开发效率  
- ✅ 减少自定义代码维护
- ✅ 官方文档和社区支持
- ✅ 内置最佳实践
- ✅ 自动安全更新

### 扩展能力
- ✅ Two-Factor Authentication
- ✅ Magic Link 登录
- ✅ Passkey 支持
- ✅ Rate Limiting
- ✅ Advanced Session Management

## 📅 迁移时间线

- **第1周**: Node.js后端搭建和Better Auth配置
- **第2周**: 数据库迁移和API测试
- **第3周**: 前端客户端迁移
- **第4周**: 功能测试和部署

## 🔄 回滚方案

保留现有FastAPI实现作为备份，通过环境变量切换：
```typescript
const AUTH_BACKEND = process.env.AUTH_BACKEND || 'better-auth'; // 'fastapi'
```
