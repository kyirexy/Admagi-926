# FastAPI 身份验证最佳实践方案

## 🎯 为什么选择FastAPI？

### 技术优势
- ✅ **高性能**: 基于Starlette和Pydantic，性能接近Node.js
- ✅ **自动文档**: 内置Swagger UI和ReDoc文档
- ✅ **类型安全**: 完整的Python类型提示支持
- ✅ **异步支持**: 原生async/await支持
- ✅ **Python生态**: 丰富的机器学习和AI库支持

### 与Better Auth功能对比

| 功能特性 | FastAPI + 自定义 | Better Auth | 实现难度 |
|---------|-----------------|-------------|----------|
| 邮箱密码认证 | ✅ 已实现 | ✅ | 简单 |
| JWT令牌管理 | ✅ 已实现 | ✅ | 简单 |
| 会话管理 | ✅ 已实现 | ✅ | 中等 |
| 邮件服务 | ✅ 已实现 | ✅ | 简单 |
| 密码重置 | ⚠️ 待实现 | ✅ | 简单 |
| 邮箱验证 | ⚠️ 待实现 | ✅ | 简单 |
| 社交登录 | ❌ 未实现 | ✅ | 复杂 |
| 双因子认证 | ❌ 未实现 | ✅ (插件) | 复杂 |
| Rate Limiting | ❌ 未实现 | ✅ | 简单 |

## 🔧 FastAPI认证完整实现

### 1. 密码重置功能

```python
# backend/password_reset.py
from fastapi import HTTPException
import secrets
import smtplib
from datetime import datetime, timedelta

class PasswordResetService:
    def __init__(self):
        self.reset_tokens = {}  # 生产环境应存储在Redis
    
    def generate_reset_token(self, email: str) -> str:
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=1)
        self.reset_tokens[token] = {
            "email": email,
            "expires_at": expires_at
        }
        return token
    
    def verify_reset_token(self, token: str) -> str:
        if token not in self.reset_tokens:
            raise HTTPException(status_code=400, detail="无效的重置令牌")
        
        token_data = self.reset_tokens[token]
        if datetime.utcnow() > token_data["expires_at"]:
            del self.reset_tokens[token]
            raise HTTPException(status_code=400, detail="重置令牌已过期")
        
        return token_data["email"]

# 在main.py中添加端点
@app.post("/api/auth/forget-password")
async def forget_password(email: str):
    user = get_user_by_email(db, email)
    if not user:
        # 安全考虑：即使用户不存在也返回成功
        return {"message": "如果该邮箱存在，您将收到重置邮件"}
    
    token = password_reset_service.generate_reset_token(email)
    reset_url = f"http://localhost:3000/reset-password?token={token}"
    
    await email_service.send_reset_password_email(email, user.name, reset_url)
    return {"message": "重置邮件已发送"}

@app.post("/api/auth/reset-password")
async def reset_password(token: str, new_password: str, db: Session = Depends(get_db)):
    email = password_reset_service.verify_reset_token(token)
    
    # 更新密码
    hashed_password = get_password_hash(new_password)
    update_user_password(db, email, hashed_password)
    
    # 删除使用过的令牌
    del password_reset_service.reset_tokens[token]
    
    return {"message": "密码重置成功"}
```

### 2. 邮箱验证功能

```python
# backend/email_verification.py
class EmailVerificationService:
    def __init__(self):
        self.verification_tokens = {}
    
    def generate_verification_token(self, email: str) -> str:
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=1)
        self.verification_tokens[token] = {
            "email": email,
            "expires_at": expires_at
        }
        return token
    
    async def send_verification_email(self, email: str, name: str):
        token = self.generate_verification_token(email)
        verification_url = f"http://localhost:3000/verify-email?token={token}"
        
        await email_service.send_verification_email(email, name, verification_url)
        return token

# 添加端点
@app.post("/api/auth/send-verification-email")
async def send_verification_email(email: str):
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    await verification_service.send_verification_email(email, user.name)
    return {"message": "验证邮件已发送"}

@app.get("/api/auth/verify-email")
async def verify_email(token: str, db: Session = Depends(get_db)):
    email = verification_service.verify_verification_token(token)
    
    # 标记邮箱为已验证
    update_user_email_verified(db, email, True)
    
    return {"message": "邮箱验证成功", "redirect": "/"}
```

### 3. Rate Limiting

```python
# backend/rate_limiter.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# 在认证端点添加限制
@app.post("/api/auth/sign-in")
@limiter.limit("5/minute")  # 每分钟最多5次登录尝试
async def sign_in(request: Request, user_data: UserSignIn, db: Session = Depends(get_db)):
    # 登录逻辑
    pass

@app.post("/api/auth/sign-up") 
@limiter.limit("3/minute")  # 每分钟最多3次注册尝试
async def sign_up(request: Request, user_data: UserCreate, db: Session = Depends(get_db)):
    # 注册逻辑
    pass
```

### 4. 社交登录支持

```python
# backend/social_auth.py
from authlib.integrations.starlette_client import OAuth
from starlette.middleware.sessions import SessionMiddleware

# OAuth配置
oauth = OAuth()
oauth.register(
    name='google',
    client_id='your-google-client-id',
    client_secret='your-google-client-secret',
    server_metadata_url='https://accounts.google.com/.well-known/openid_configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

@app.get("/api/auth/google")
async def google_login(request: Request):
    redirect_uri = request.url_for('google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/api/auth/google/callback")
async def google_callback(request: Request):
    token = await oauth.google.authorize_access_token(request)
    user_info = token.get('userinfo')
    
    # 创建或获取用户
    user = get_or_create_social_user(user_info)
    
    # 生成JWT令牌
    access_token = create_access_token({"sub": user.email})
    
    return {"access_token": access_token, "user": user}
```

## 📊 实施优先级

### 高优先级（本周完成）
1. ✅ 密码重置功能
2. ✅ 邮箱验证功能  
3. ✅ Rate Limiting
4. ✅ 错误处理优化

### 中优先级（下周完成）
1. 🔄 社交登录（Google, GitHub）
2. 🔒 双因子认证（TOTP）
3. 📱 设备管理
4. 🛡️ 安全增强

### 低优先级（后续版本）
1. 🎯 高级会话管理
2. 🔐 Passkey支持
3. 🌐 Magic Link登录
4. 📈 审计日志

## 🎯 最终效果

实施完成后，您的FastAPI认证系统将具备：

✅ **完整功能**: 与Better Auth功能相当
✅ **高性能**: FastAPI的原生性能优势  
✅ **Python生态**: 完美集成机器学习库
✅ **自定义灵活性**: 完全控制认证逻辑
✅ **维护简单**: 单一语言栈，减少复杂度

## 💰 成本对比

| 方案 | 开发时间 | 学习成本 | 维护成本 | 功能完整度 |
|------|---------|---------|---------|-----------|
| 优化FastAPI | 2-3周 | 低 | 低 | 95% |
| 迁移Better Auth | 4-6周 | 高 | 中 | 100% |

**推荐**: 继续优化FastAPI方案，投入产出比更高！
