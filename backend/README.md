# 万相营造 FastAPI 后端服务

基于 FastAPI 的用户认证和AI服务系统，提供完整的用户管理、认证授权和业务功能。

## 🚀 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置环境变量

复制 `env.example` 到 `.env` 并配置：

```bash
cp env.example .env
```

主要配置项：
- `DATABASE_URL`: PostgreSQL数据库连接
- `SECRET_KEY`: JWT密钥
- `PORT`: 服务端口（默认8000）

### 3. 启动服务

```bash
python start_server.py
```

或者直接运行：

```bash
python app.py
```

## 📁 项目结构

```
backend/
├── app.py                    # 主应用入口
├── start_server.py          # 启动脚本
├── requirements.txt          # Python依赖
├── env.example              # 环境变量示例
├── README.md               # 项目说明
├── models_adapted.py       # 数据库模型
├── schemas_fastapi_users.py # API架构定义
├── auth_service.py         # 认证服务
├── auth.py                 # 认证工具函数
└── database.py             # 数据库连接
```

## 🔐 认证系统

### 功能特性

- ✅ 用户注册和登录
- ✅ JWT令牌认证
- ✅ 会话管理
- ✅ 密码加密存储
- ✅ 用户信息管理
- ✅ 角色权限控制
- ✅ 邮箱验证（待实现）
- ✅ 密码重置（待实现）

### API接口

#### 用户认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/sign-up` - 用户注册（兼容接口）
- `POST /api/auth/jwt/login` - JWT登录
- `POST /api/auth/sign-in` - 用户登录（兼容接口）
- `POST /api/auth/jwt/logout` - JWT登出
- `POST /api/auth/sign-out` - 用户登出（兼容接口）
- `GET /api/auth/session` - 获取会话信息

#### 用户管理
- `GET /api/users/me` - 获取当前用户信息
- `PATCH /api/users/me` - 更新用户信息

#### 管理员功能
- `GET /api/admin/users` - 获取所有用户（管理员）
- `GET /api/admin/stats` - 获取统计信息（管理员）

## 🗄️ 数据库

使用 PostgreSQL 数据库，主要表结构：

- `user` - 用户表
- `session` - 会话表
- `account` - OAuth账户表
- `verification` - 验证表
- `api_keys` - API密钥表

## 🔧 开发

### 数据库迁移

```bash
# 创建迁移
alembic revision --autogenerate -m "描述"

# 执行迁移
alembic upgrade head
```

### 测试

```bash
# 运行测试
python -m pytest

# 测试特定功能
python auth_service.py
```

## 📚 API文档

启动服务后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🌐 前端集成

前端使用 `auth-client.ts` 与后端API集成，支持：

- 用户注册和登录
- 会话管理
- 自动token刷新
- 错误处理

## 🚀 部署

### Docker部署

```bash
# 构建镜像
docker build -t admagic-backend .

# 运行容器
docker run -p 8000:8000 admagic-backend
```

### 生产环境

1. 设置生产环境变量
2. 使用 Gunicorn 或 Uvicorn 部署
3. 配置反向代理（Nginx）
4. 设置SSL证书

## 📝 更新日志

### v2.0.0
- 统一FastAPI应用入口
- 清理冗余文件
- 优化项目结构
- 完善认证系统
- 添加兼容性接口

## 🤝 贡献

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License