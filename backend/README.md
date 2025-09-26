# AdMagic 后端服务

万相营造 AI电商平台的 Node.js 后端服务，基于 Better Auth 提供用户认证功能。

## 项目结构

```
backend/
├── src/
│   ├── config/          # 配置文件
│   │   ├── auth.js      # Better Auth 配置
│   │   └── database.js  # 数据库配置
│   ├── controllers/     # 控制器 (待添加)
│   ├── middleware/      # 中间件
│   │   └── cors.js      # CORS 中间件
│   ├── models/          # 数据模型 (待添加)
│   ├── routes/          # 路由
│   │   └── auth.js      # 认证路由
│   ├── services/        # 服务层
│   │   └── email.js     # 邮件服务
│   └── utils/           # 工具函数
│       └── request.js   # 请求处理工具
├── server.js            # 服务器入口文件
├── package.json         # 项目依赖
├── .env.example         # 环境变量示例
└── README.md           # 项目说明
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写实际配置：

```bash
cp .env.example .env
```

### 3. 数据库设置

确保 PostgreSQL 数据库运行，并创建 `admagic` 数据库：

```sql
CREATE DATABASE admagic;
```

运行数据库表创建脚本：

```bash
psql -h localhost -U postgres -d admagic -f create_tables.sql
```

### 4. 启动服务器

#### 方式一：使用 Python 启动脚本
```bash
python start_dev.py
```

#### 方式二：直接使用 npm
```bash
npm start
```

#### 方式三：开发模式
```bash
npm run dev
```

## API 端点

### 认证相关

- `POST /api/auth/sign-up` - 用户注册
- `POST /api/auth/sign-in` - 用户登录
- `POST /api/auth/sign-out` - 用户登出
- `GET /api/auth/session` - 获取会话信息
- `POST /api/auth/forgot-password` - 忘记密码
- `POST /api/auth/reset-password` - 重置密码
- `POST /api/auth/verify-email` - 验证邮箱

### 其他

- `GET /` - API 信息
- `GET /health` - 健康检查

## 数据库表结构

### user 表
- `id` - 用户ID (主键)
- `name` - 用户名
- `email` - 邮箱 (唯一)
- `emailVerified` - 邮箱验证状态
- `image` - 头像URL
- `createdAt` - 创建时间
- `updatedAt` - 更新时间

### session 表
- `id` - 会话ID (主键)
- `expiresAt` - 过期时间
- `token` - 会话令牌 (唯一)
- `createdAt` - 创建时间
- `updatedAt` - 更新时间
- `ipAddress` - IP地址
- `userAgent` - 用户代理
- `userId` - 用户ID (外键)

## 开发说明

### 环境要求

- Node.js >= 16
- PostgreSQL >= 12
- npm >= 8

### 开发工具

推荐使用 PyCharm 进行开发，可以配置以下运行配置：

1. **Python 启动方式**：运行 `start_dev.py`
2. **Node.js 启动方式**：运行 `server.js`

### 代码规范

- 使用 ES6+ 语法
- 遵循模块化设计原则
- 统一错误处理
- 完善的日志记录

## 故障排除

### 数据库连接失败

1. 检查 PostgreSQL 服务是否运行
2. 验证 `.env` 文件中的数据库配置
3. 确认数据库 `admagic` 已创建
4. 检查用户权限

### 邮件发送失败

1. 检查邮件服务器配置
2. 验证邮箱密码（可能需要应用专用密码）
3. 确认防火墙设置

### 端口占用

如果 8000 端口被占用，可以在 `.env` 文件中修改 `PORT` 配置。

## 许可证

MIT License