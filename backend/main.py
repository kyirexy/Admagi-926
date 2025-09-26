"""
万相营造 AI电商平台后端服务
基于 FastAPI 的用户认证系统
"""

from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional
import uvicorn
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# 导入自定义模块
from database import get_db, create_tables, test_connection
from auth import (
    UserCreate, UserResponse, Token, 
    create_user, authenticate_user, get_current_user,
    create_access_token, create_user_session, delete_user_session
)

# 加载环境变量
load_dotenv()

# 创建FastAPI应用
app = FastAPI(
    title="万相营造 AI电商平台",
    description="基于 FastAPI 的用户认证系统",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS中间件配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 前端地址
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 安全配置
security = HTTPBearer()

# Pydantic模型
class UserSignIn(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    message: str
    access_token: str
    token_type: str
    user: UserResponse

# 启动事件
@app.on_event("startup")
async def startup_event():
    """应用启动时的初始化"""
    print("正在启动万相营造 FastAPI 服务器...")
    
    # 测试数据库连接
    if test_connection():
        print("✅ 数据库连接成功")
        create_tables()
        print("✅ 数据库表初始化完成")
    else:
        print("❌ 数据库连接失败")
        raise Exception("数据库连接失败")

# 根路径
@app.get("/")
async def root():
    return {
        "message": "万相营造 FastAPI 服务器",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "endpoints": [
            "POST /api/auth/sign-up - 用户注册",
            "POST /api/auth/sign-in - 用户登录",
            "POST /api/auth/sign-out - 用户登出",
            "GET /api/auth/session - 获取会话信息",
            "GET /health - 健康检查",
            "GET /docs - API文档"
        ]
    }

# 健康检查
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "service": "AdMagic FastAPI Backend",
        "database": "connected" if test_connection() else "disconnected"
    }

# 用户注册
@app.post("/api/auth/sign-up", response_model=dict)
async def sign_up(user_data: UserCreate, request: Request, db: Session = Depends(get_db)):
    """用户注册接口"""
    try:
        # 创建用户
        user = create_user(db, user_data)
        
        # 创建访问令牌
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        # 创建用户会话
        create_user_session(
            db, 
            user.id, 
            access_token,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        
        return {
            "message": "注册成功",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "emailVerified": user.emailVerified,  # 使用正确的字段名
                "createdAt": user.createdAt.isoformat()  # 使用正确的字段名
            },
            "access_token": access_token,
            "token_type": "bearer"
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"注册失败: {str(e)}"
        )

# 用户登录
@app.post("/api/auth/sign-in", response_model=dict)
async def sign_in(user_data: UserSignIn, request: Request, db: Session = Depends(get_db)):
    """用户登录接口"""
    try:
        # 验证用户
        user = authenticate_user(db, user_data.email, user_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="邮箱或密码错误"
            )
        
        # 创建访问令牌
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        # 创建用户会话
        create_user_session(
            db, 
            user.id, 
            access_token,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
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

# 用户登出
@app.post("/api/auth/sign-out")
async def sign_out(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """用户登出接口"""
    try:
        token = credentials.credentials
        delete_user_session(db, token)
        return {"message": "登出成功"}
    except Exception as e:
        return {"message": "登出成功"}  # 即使失败也返回成功，避免前端错误

# 获取会话信息
@app.get("/api/auth/session")
async def get_session(current_user = Depends(get_current_user)):
    """获取当前用户会话信息"""
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

# 测试接口
@app.get("/api/test")
async def test_endpoint():
    """测试接口"""
    return {
        "message": "FastAPI 后端运行正常",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )