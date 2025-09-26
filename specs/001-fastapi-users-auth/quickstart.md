# 快速启动指南 - FastAPI-Users认证系统

本指南将帮助您快速设置和运行万相营造的FastAPI-Users认证系统。

## 📋 前置要求

### 系统要求
- **Python**: 3.8+ （推荐3.11+）
- **PostgreSQL**: 12+ （现有数据库）
- **Node.js**: 16+ （前端开发，如需）
- **内存**: 最少2GB RAM
- **磁盘**: 最少1GB可用空间

### 开发工具
- Git
- VS Code 或其他IDE
- Postman 或类似的API测试工具
- PostgreSQL客户端（pgAdmin, DBeaver等）

## ⚡ 快速开始（5分钟设置）

### 1. 环境准备
```bash
# 克隆项目（如果还没有）
git clone <project-repo>
cd admagic1

# 创建Python虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate     # Windows

# 安装FastAPI-Users依赖
pip install -r backend/requirements-fastapi-users.txt
```

### 2. 环境配置
```bash
# 复制环境配置文件
cp backend/.env.fastapi-users backend/.env

# 编辑环境配置
nano backend/.env  # 或使用其他编辑器
```

**关键配置项**:
```env
# 数据库连接
DATABASE_URL=postgresql+asyncpg://postgres:123456@localhost:5432/admagic

# JWT密钥（生产环境必须修改）
SECRET_KEY=your-super-secret-key-here-change-in-production

# 邮件服务
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587

# 前端URL
FRONTEND_URL=http://localhost:3000
```

### 3. 数据库迁移
```bash
cd backend

# 分析现有数据（可选）
python migrate_to_fastapi_users.py
# 选择 "1. 分析现有数据"

# 执行完整迁移
python migrate_to_fastapi_users.py  
# 选择 "2. 完整迁移"
```

### 4. 启动服务
```bash
# 方式1：使用启动脚本（推荐）
cd ..
python start_fastapi_users_server.py

# 方式2：直接启动
cd backend
uvicorn main_fastapi_users:app --reload --host 0.0.0.0 --port 8000
```

### 5. 验证安装
在浏览器中访问：
- **API文档**: http://localhost:8000/docs
- **健康检查**: http://localhost:8000/health
- **重文档**: http://localhost:8000/redoc

## 🧪 系统测试

### 自动化测试
```bash
cd backend

# 运行完整系统测试
python test_fastapi_users_system.py

# 预期输出：所有测试通过
# ✅ 服务器运行正常
# ✅ 用户注册成功
# ✅ 用户登录成功
# ✅ 获取用户信息成功
# ✅ Better Auth兼容接口正常
```

### 手动API测试

#### 1. 用户注册
```bash
curl -X POST "http://localhost:8000/api/auth/register" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123",
       "name": "测试用户"
     }'
```

**预期响应**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "test@example.com",
  "name": "测试用户",
  "is_active": true,
  "is_verified": false,
  "credits": 100,
  "plan": "FREE"
}
```

#### 2. 用户登录
```bash
curl -X POST "http://localhost:8000/api/auth/jwt/login" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=test@example.com&password=password123"
```

**预期响应**:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

#### 3. 获取用户信息
```bash
# 使用上一步获得的token
curl -X GET "http://localhost:8000/api/users/me" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 4. Better Auth兼容测试
```bash
curl -X GET "http://localhost:8000/api/auth/session" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**预期响应**:
```json
{
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "test@example.com",
      "name": "测试用户"
    },
    "session": {
      "active": true,
      "expires_at": "2024-12-31T23:59:59Z"
    }
  },
  "error": null
}
```

## 🎯 前端集成

### 1. 更新认证客户端
```bash
# 在前端目录
cd frontend

# 如果有新的客户端文件，替换旧的
cp lib/fastapi-users-client.ts lib/auth-client.ts
```

### 2. 测试前端认证
```typescript
import { authClient } from '@/lib/fastapi-users-client'

// 注册测试
const result = await authClient.signUp.email({
  email: "frontend-test@example.com",
  password: "password123",
  name: "前端测试用户"
})

if (result.error) {
  console.error('注册失败:', result.error)
} else {
  console.log('注册成功:', result.data)
}
```

### 3. 启动前端开发服务器
```bash
cd frontend
npm run dev
# 或
yarn dev
```

访问 http://localhost:3000 测试完整的用户认证流程。

## 📊 性能基准测试

### 基本性能测试
```bash
# 安装Apache Bench（如果没有）
# Ubuntu: sudo apt-get install apache2-utils
# macOS: brew install httpie

# 测试注册端点性能
ab -n 100 -c 10 -T 'application/json' \
   -p register_payload.json \
   http://localhost:8000/api/auth/register

# 测试登录端点性能  
ab -n 1000 -c 50 \
   -T 'application/x-www-form-urlencoded' \
   -p login_payload.txt \
   http://localhost:8000/api/auth/jwt/login
```

**预期性能指标**:
- 注册: < 200ms 平均响应时间
- 登录: < 100ms 平均响应时间  
- 获取用户信息: < 50ms 平均响应时间
- 并发支持: 100+ 并发用户

## 🚨 故障排除

### 常见问题解决

#### 1. 数据库连接失败
```bash
# 检查PostgreSQL状态
sudo systemctl status postgresql

# 检查数据库连接
psql -h localhost -U postgres -d admagic -c "SELECT version();"

# 验证环境变量
echo $DATABASE_URL
```

#### 2. 邮件发送失败
```bash
# 测试SMTP连接
python -c "
import smtplib
server = smtplib.SMTP('smtp.gmail.com', 587)
server.starttls()
server.login('your-email@gmail.com', 'your-app-password')
print('SMTP连接成功')
"
```

#### 3. 依赖安装失败
```bash
# 清理pip缓存
pip cache purge

# 升级pip
pip install --upgrade pip

# 重新安装依赖
pip install -r backend/requirements-fastapi-users.txt --no-cache-dir
```

#### 4. 前端认证失败
```bash
# 检查API可达性
curl -I http://localhost:8000/health

# 检查CORS配置
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS http://localhost:8000/api/auth/register
```

### 日志分析
```bash
# 查看应用日志
tail -f backend/logs/app.log

# 查看数据库连接日志
tail -f /var/log/postgresql/postgresql-*.log

# 查看系统资源使用
htop
# 或
top
```

## 🔧 配置优化

### 生产环境配置
```env
# .env 生产环境配置
NODE_ENV=production
SECRET_KEY=extremely-long-random-secret-key-for-production
DATABASE_URL=postgresql+asyncpg://user:password@prod-db-host:5432/admagic_prod
CORS_ORIGINS=https://yourdomain.com
SECURE_COOKIES=true
```

### 性能优化
```python
# main_fastapi_users.py 性能配置
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,  # CORS缓存
)

# 数据库连接池
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=30,
    pool_timeout=30,
    pool_recycle=3600
)
```

## 📈 监控和维护

### 健康检查监控
```bash
# 创建监控脚本
cat > monitor_health.sh << 'EOF'
#!/bin/bash
while true; do
  if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "$(date): ✅ Service healthy"
  else
    echo "$(date): ❌ Service down - restarting..."
    # 重启服务逻辑
  fi
  sleep 30
done
EOF

chmod +x monitor_health.sh
./monitor_health.sh &
```

### 定期维护任务
```bash
# 数据库连接检查
python -c "
import asyncio
from backend.models import engine
asyncio.run(engine.begin())
print('数据库连接正常')
"

# 清理过期token（可选）
python -c "
import asyncio
from backend.cleanup import cleanup_expired_tokens
asyncio.run(cleanup_expired_tokens())
"
```

## 🎉 完成检查清单

启动成功后，确认以下功能正常：

- [ ] **API文档** - http://localhost:8000/docs 可访问
- [ ] **健康检查** - 返回 "healthy" 状态
- [ ] **用户注册** - 可创建新用户并发送邮件
- [ ] **用户登录** - 返回有效JWT令牌
- [ ] **会话管理** - 可获取用户信息
- [ ] **密码重置** - 可发送重置邮件
- [ ] **邮箱验证** - 可发送验证邮件
- [ ] **前端集成** - 前端可正常调用API
- [ ] **Better Auth兼容** - 兼容接口返回正确格式
- [ ] **数据迁移** - 现有用户数据完整迁移

如果所有检查项都通过，恭喜您！FastAPI-Users认证系统已经成功部署并运行。

## 📞 获取帮助

如果遇到问题：
1. 查看 `/backend/logs/` 目录下的日志文件
2. 运行 `python test_fastapi_users_system.py` 诊断系统状态
3. 检查 [FastAPI-Users官方文档](https://fastapi-users.github.io/fastapi-users/latest/)
4. 联系开发团队或查看项目文档
