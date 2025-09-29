"""
万相营造 AI电商平台后端服务
统一的FastAPI应用入口
"""

from fastapi import FastAPI, Depends, HTTPException, status, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
import uvicorn
import os
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 导入自定义模块
from models_adapted import get_db, User, SessionLocal
from schemas_fastapi_users import (
    UserRead, UserCreate, UserUpdate, Token, LoginForm,
    HealthResponse, ErrorResponse, EmailVerificationRequest,
    PasswordResetRequest, PasswordReset
)
from auth_service import (
    AuthService, get_current_user, get_current_active_user, 
    get_current_superuser
)
from ai_routes import router as ai_router
from video_routes import router as video_router

# 应用生命周期管理
@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用启动和关闭时的生命周期管理"""
    print("🚀 启动万相营造 FastAPI 服务器...")
    
    # 测试数据库连接
    try:
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        print("✅ 数据库连接正常")
    except Exception as e:
        print(f"❌ 数据库连接失败: {e}")
    
    yield
    
    print("👋 万相营造服务器关闭")

# 创建FastAPI应用
app = FastAPI(
    title="万相营造 AI电商平台",
    description="基于FastAPI的用户认证和AI服务系统",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS中间件配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        os.getenv("FRONTEND_URL", "http://localhost:3000")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ========== 路由注册 ==========
app.include_router(ai_router)
app.include_router(video_router)

# ========== 系统路由 ==========

@app.get("/", tags=["系统"])
async def root():
    """根路径"""
    return {
        "message": "万相营造 FastAPI 认证系统",
        "version": "2.0.0",
        "docs": "/docs",
        "auth_system": "FastAPI-Users",
        "database": "PostgreSQL",
        "features": [
            "标准用户注册和登录",
            "JWT令牌认证",
            "邮箱验证",
            "密码重置",
            "用户信息管理",
            "角色权限控制"
        ]
    }

@app.get("/health", response_model=HealthResponse, tags=["系统"])
async def health_check():
    """健康检查"""
    try:
        # 测试数据库连接
        db = SessionLocal()
        user_count = db.query(User).count()
        db.close()
        
        return HealthResponse(
            status="healthy",
            service="AdMagic FastAPI Backend",
            version="2.0.0",
            database=f"PostgreSQL ({user_count} users)"
        )
    except Exception as e:
        return HealthResponse(
            status="unhealthy",
            service="AdMagic FastAPI Backend", 
            version="2.0.0",
            database=f"Error: {str(e)}"
        )

# ========== 用户注册 ==========

@app.post("/api/auth/register", response_model=UserRead, tags=["认证"])
async def register(
    user_create: UserCreate,
    db: Session = Depends(get_db)
):
    """
    用户注册
    FastAPI-Users标准接口
    """
    try:
        auth_service = AuthService(db)
        user = auth_service.create_user(user_create)
        
        print(f"✅ 新用户注册: {user.email}")
        return UserRead.from_orm(user)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"注册失败: {str(e)}"
        )

# ========== JWT认证 ==========

@app.post("/api/auth/jwt/login", response_model=Token, tags=["认证"])
async def login(
    username: str = Form(..., description="邮箱地址"),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    JWT登录
    FastAPI-Users标准接口，使用Form表单
    """
    auth_service = AuthService(db)
    user = auth_service.authenticate_user(username, password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"✅ 用户登录: {user.email}")
    access_token = auth_service.create_user_token(user)
    return access_token

@app.post("/api/auth/jwt/logout", tags=["认证"])
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    db: Session = Depends(get_db)
):
    """JWT登出"""
    auth_service = AuthService(db)
    auth_service.revoke_session(credentials.credentials)
    print("✅ 用户登出")
    return {"message": "Successfully logged out"}

# ========== 兼容性接口（支持前端现有调用） ==========

@app.post("/api/auth/sign-up", response_model=dict, tags=["认证"])
async def sign_up_compat(user_data: UserCreate, request: Request, db: Session = Depends(get_db)):
    """用户注册接口（兼容前端）"""
    try:
        auth_service = AuthService(db)
        user = auth_service.create_user(user_data)
        
        # 创建访问令牌
        access_token_expires = timedelta(minutes=30)
        access_token = auth_service.create_access_token(
            data={"sub": user.id}, expires_delta=access_token_expires
        )
        
        # 自动发送验证邮件
        from email_service import email_service
        from verification_tokens import TokenManager
        
        token_manager = TokenManager(db)
        verification_token = token_manager.create_email_verification_token(user.email)
        
        # 构建验证URL
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        verification_url = f"{frontend_url}/auth/verify-email?token={verification_token}"
        
        # 异步发送验证邮件（不阻塞注册流程）
        try:
            email_service.send_verification_email(user.email, verification_url)
            print(f"📧 验证邮件已发送到: {user.email}")
        except Exception as e:
            print(f"⚠️ 发送验证邮件失败: {str(e)}")
            # 不影响注册流程，只记录错误
        
        return {
            "message": "注册成功",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "emailVerified": user.emailVerified,
                "createdAt": user.createdAt.isoformat()
            },
            "access_token": access_token,
            "token_type": "bearer"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"注册失败: {str(e)}"
        )

@app.post("/api/auth/sign-in", response_model=dict, tags=["认证"])
async def sign_in_compat(user_data: dict, request: Request, db: Session = Depends(get_db)):
    """用户登录接口（兼容前端）"""
    try:
        auth_service = AuthService(db)
        user = auth_service.authenticate_user(user_data["email"], user_data["password"])
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="邮箱或密码错误"
            )
        
        # 创建访问令牌
        access_token_expires = timedelta(minutes=30)
        access_token = auth_service.create_access_token(
            data={"sub": user.id}, expires_delta=access_token_expires
        )
        
        return {
            "message": "登录成功",
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "emailVerified": user.emailVerified,
                "createdAt": user.createdAt.isoformat()
            }
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"登录失败: {str(e)}"
        )

@app.post("/api/auth/sign-out", tags=["认证"])
async def sign_out_compat(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    db: Session = Depends(get_db)
):
    """用户登出接口（兼容前端）"""
    try:
        auth_service = AuthService(db)
        auth_service.revoke_session(credentials.credentials)
        return {"message": "登出成功"}
    except Exception as e:
        return {"message": "登出成功"}  # 即使失败也返回成功，避免前端错误

@app.get("/api/auth/session", tags=["认证"])
async def get_session_compat(current_user = Depends(get_current_user)):
    """获取当前用户会话信息（兼容前端）"""
    return {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "emailVerified": current_user.emailVerified,
            "createdAt": current_user.createdAt.isoformat()
        },
        "session": {
            "active": True,
            "expires_at": (datetime.utcnow() + timedelta(minutes=30)).isoformat()
        }
    }

# ========== 用户管理 ==========

@app.get("/api/users/me", response_model=UserRead, tags=["用户"])
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """获取当前用户信息"""
    return UserRead.from_orm(current_user)

@app.patch("/api/users/me", response_model=UserRead, tags=["用户"])
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """更新当前用户信息"""
    auth_service = AuthService(db)
    update_data = user_update.model_dump(exclude_unset=True)
    
    # 处理密码更新
    if 'password' in update_data:
        update_data['password_hash'] = auth_service.get_password_hash(update_data['password'])
        del update_data['password']
    
    updated_user = auth_service.update_user(current_user.id, **update_data)
    print(f"✅ 用户信息更新: {current_user.email}")
    return UserRead.from_orm(updated_user)

# ========== 邮箱验证 ==========

@app.post("/api/auth/request-verify-token", tags=["邮箱验证"])
async def request_verify_token(
    request: EmailVerificationRequest,
    db: Session = Depends(get_db)
):
    """请求邮箱验证令牌"""
    from email_service import email_service
    from verification_tokens import TokenManager
    
    # 检查用户是否存在
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="用户不存在"
        )
    
    if user.emailVerified:
        return {"message": "邮箱已经验证过了"}
    
    # 创建验证token
    token_manager = TokenManager(db)
    token = token_manager.create_email_verification_token(request.email)
    
    # 构建验证URL
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    verification_url = f"{frontend_url}/auth/verify-email?token={token}"
    
    # 发送验证邮件
    success = email_service.send_verification_email(request.email, verification_url)
    
    if success:
        print(f"📧 邮箱验证请求: {request.email}")
        return {"message": "验证邮件已发送，请检查您的邮箱"}
    else:
        raise HTTPException(
            status_code=500,
            detail="发送验证邮件失败，请稍后重试"
        )

@app.post("/api/auth/verify", tags=["邮箱验证"])  
async def verify_email(
    token: str,
    db: Session = Depends(get_db)
):
    """验证邮箱"""
    from verification_tokens import TokenManager
    
    token_manager = TokenManager(db)
    is_valid, email_or_error = token_manager.verify_token(token, "email_verification")
    
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail=email_or_error
        )
    
    # 查找用户并更新验证状态
    user = db.query(User).filter(User.email == email_or_error).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="用户不存在"
        )
    
    # 更新用户邮箱验证状态
    user.emailVerified = True
    user.updatedAt = datetime.utcnow()
    
    # 标记token为已使用
    token_manager.mark_token_used(token)
    
    db.commit()
    
    print(f"✅ 邮箱验证成功: {email_or_error}")
    return {
        "message": "邮箱验证成功",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "emailVerified": user.emailVerified,
            "createdAt": user.createdAt.isoformat()
        }
    }

# ========== 密码重置 ==========

@app.post("/api/auth/forgot-password", tags=["密码重置"])
async def forgot_password(
    request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """请求密码重置"""
    from email_service import email_service
    from verification_tokens import TokenManager
    
    # 检查用户是否存在
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # 为了安全，即使用户不存在也返回成功消息
        return {"message": "如果该邮箱已注册，您将收到密码重置邮件"}
    
    # 创建密码重置token
    token_manager = TokenManager(db)
    token = token_manager.create_password_reset_token(request.email)
    
    # 构建重置URL
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    reset_url = f"{frontend_url}/auth/reset-password?token={token}"
    
    # 发送密码重置邮件
    success = email_service.send_password_reset_email(request.email, reset_url)
    
    if success:
        print(f"🔐 密码重置请求: {request.email}")
        return {"message": "如果该邮箱已注册，您将收到密码重置邮件"}
    else:
        raise HTTPException(
            status_code=500,
            detail="发送邮件失败，请稍后重试"
        )

@app.post("/api/auth/reset-password", tags=["密码重置"])
async def reset_password(
    request: PasswordReset,
    db: Session = Depends(get_db)
):
    """重置密码"""
    from verification_tokens import TokenManager
    
    token_manager = TokenManager(db)
    is_valid, email_or_error = token_manager.verify_token(request.token, "password_reset")
    
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail=email_or_error
        )
    
    # 查找用户并更新密码
    user = db.query(User).filter(User.email == email_or_error).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="用户不存在"
        )
    
    # 更新密码
    auth_service = AuthService(db)
    user.password_hash = auth_service.get_password_hash(request.newPassword)
    user.updatedAt = datetime.utcnow()
    
    # 标记token为已使用
    token_manager.mark_token_used(request.token)
    
    db.commit()
    
    print(f"✅ 密码重置成功: {email_or_error}")
    return {"message": "密码重置成功，请使用新密码登录"}

# ========== 管理员路由 ==========

@app.get("/api/admin/users", response_model=list[UserRead], tags=["管理员"])
async def list_all_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_superuser),
    db: Session = Depends(get_db)
):
    """获取所有用户列表（管理员）"""
    users = db.query(User).offset(skip).limit(limit).all()
    return [UserRead.from_orm(user) for user in users]

@app.get("/api/admin/stats", tags=["管理员"])
async def get_admin_stats(
    current_user: User = Depends(get_current_superuser),
    db: Session = Depends(get_db)
):
    """获取管理员统计信息"""
    total_users = db.query(User).count()
    verified_users = db.query(User).filter(User.emailVerified == True).count()
    
    return {
        "total_users": total_users,
        "verified_users": verified_users,
        "unverified_users": total_users - verified_users,
        "roles_distribution": {
            "USER": db.query(User).filter(User.role == "USER").count(),
            "ADMIN": db.query(User).filter(User.role == "ADMIN").count(),
            "DESIGNER": db.query(User).filter(User.role == "DESIGNER").count()
        },
        "plans_distribution": {
            "FREE": db.query(User).filter(User.plan == "FREE").count(),
            "PRO": db.query(User).filter(User.plan == "PRO").count(), 
            "ENTERPRISE": db.query(User).filter(User.plan == "ENTERPRISE").count()
        }
    }

# ========== 业务功能路由 ==========

@app.post("/api/ai/generate", tags=["AI服务"])
async def ai_generate(
    prompt: str,
    type: str = "image",
    current_user: User = Depends(get_current_active_user)
):
    """AI生成服务（示例）"""
    print(f"🎨 AI生成请求: {current_user.email} - {type} - {prompt}")
    
    return {
        "message": "AI生成任务已提交",
        "task_id": f"task_{current_user.id}_{int(time.time())}",
        "type": type,
        "prompt": prompt,
        "user_id": current_user.id,
        "estimated_time": "30秒"
    }

# ========== 异常处理器 ==========

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """HTTP异常处理器"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.detail,
            "status_code": exc.status_code,
            "path": str(request.url.path)
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """通用异常处理器"""
    print(f"❌ 未处理的异常: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "message": "Internal server error",
            "status_code": 500,
            "path": str(request.url.path)
        }
    )

# ========== 中间件 ==========

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """请求日志中间件"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    print(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s")
    return response

# ========== 启动配置 ==========

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    
    print("=" * 60)
    print("🚀 万相营造 FastAPI 服务器")
    print("=" * 60)
    print(f"📍 服务地址: http://localhost:{port}")
    print(f"📚 API文档: http://localhost:{port}/docs")  
    print(f"🔗 健康检查: http://localhost:{port}/health")
    print(f"🔐 认证系统: FastAPI-Users 标准实现")
    print("=" * 60)
    
    uvicorn.run(
        "app:app",
        host="0.0.0.0", 
        port=port,
        reload=True,
        log_level="info"
    )
