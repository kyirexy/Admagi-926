"""
FastAPI-Users Pydantic 架构
定义API请求和响应格式
"""

import uuid
from fastapi_users import schemas
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserRead(schemas.BaseUser[uuid.UUID]):
    """
    用户读取架构 - API响应用户信息的格式
    """
    # 继承FastAPI-Users基础字段：
    # - id: UUID
    # - email: EmailStr  
    # - is_active: bool
    # - is_superuser: bool
    # - is_verified: bool (对应email_verified)
    
    # 自定义字段
    name: Optional[str] = None
    username: Optional[str] = None
    image: Optional[str] = None
    avatar: Optional[str] = None
    credits: int = 100
    is_premium: bool = False
    role: str = "USER" 
    plan: str = "FREE"
    org_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class UserCreate(schemas.BaseUserCreate):
    """
    用户创建架构 - 注册时的请求格式
    """
    # 继承FastAPI-Users必需字段：
    # - email: EmailStr
    # - password: str
    
    # 自定义字段
    name: str = Field(..., min_length=1, max_length=255, description="用户姓名")
    username: Optional[str] = Field(None, min_length=3, max_length=50, description="用户名")
    image: Optional[str] = Field(None, description="用户头像URL")
    
    class Config:
        schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "strongpassword123",
                "name": "张三",
                "username": "zhangsan"
            }
        }

class UserUpdate(schemas.BaseUserUpdate):
    """
    用户更新架构 - 更新用户信息的请求格式
    """
    # 继承FastAPI-Users基础字段：
    # - password: Optional[str]
    # - email: Optional[EmailStr]
    # - is_active: Optional[bool]
    # - is_superuser: Optional[bool]
    # - is_verified: Optional[bool]
    
    # 自定义字段
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    image: Optional[str] = None
    avatar: Optional[str] = None
    credits: Optional[int] = Field(None, ge=0, description="用户积分")
    is_premium: Optional[bool] = None
    role: Optional[str] = Field(None, description="用户角色")
    plan: Optional[str] = Field(None, description="用户计划")
    
    class Config:
        schema_extra = {
            "example": {
                "name": "李四",
                "username": "lisi",
                "credits": 200
            }
        }

# Better Auth 兼容的响应格式
class AuthResponse(BaseModel):
    """
    认证响应架构 - 兼容Better Auth格式
    """
    data: Optional[dict] = None
    error: Optional[dict] = None
    
    # 向后兼容字段
    message: Optional[str] = None
    access_token: Optional[str] = None
    token_type: Optional[str] = "bearer"

class SessionData(BaseModel):
    """
    会话数据架构
    """
    user: Optional[UserRead] = None
    session: Optional[dict] = None

class BetterAuthCompatibleResponse(BaseModel):
    """
    Better Auth兼容响应 - 统一前端接口
    """
    data: Optional[SessionData] = None
    error: Optional[dict] = None

# AI生成相关架构
class AIGenerationCreate(BaseModel):
    """AI生成请求架构"""
    type: str = Field(..., description="生成类型：image, text, video")
    prompt: str = Field(..., min_length=1, max_length=2000, description="生成提示词")
    parameters: Optional[dict] = Field(default_factory=dict, description="生成参数")
    
    class Config:
        schema_extra = {
            "example": {
                "type": "image",
                "prompt": "一只可爱的小猫在花园里玩耍",
                "parameters": {
                    "style": "cartoon",
                    "size": "512x512"
                }
            }
        }

class AIGenerationResponse(BaseModel):
    """AI生成响应架构"""
    id: str
    type: str
    prompt: str
    status: str
    cost_credits: int
    result_data: Optional[dict] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

# 业务相关架构
class UserCreditsUpdate(BaseModel):
    """用户积分更新架构"""
    credits: int = Field(..., ge=0, description="新的积分值")
    reason: str = Field(..., description="积分变更原因")

class UserPlanUpdate(BaseModel):
    """用户计划更新架构"""
    plan: str = Field(..., description="新的用户计划")
    
    class Config:
        schema_extra = {
            "example": {
                "plan": "PRO"
            }
        }

# 邮件相关架构
class EmailVerificationRequest(BaseModel):
    """邮箱验证请求架构"""
    email: EmailStr = Field(..., description="要验证的邮箱地址")
    callback_url: Optional[str] = Field(None, description="验证成功后的回调URL")

class PasswordResetRequest(BaseModel):
    """密码重置请求架构"""
    email: EmailStr = Field(..., description="要重置密码的邮箱地址")
    
class PasswordReset(BaseModel):
    """密码重置架构"""
    token: str = Field(..., description="重置令牌")
    password: str = Field(..., min_length=6, description="新密码")

# 错误响应架构
class ErrorResponse(BaseModel):
    """统一错误响应架构"""
    detail: str = Field(..., description="错误详情")
    status_code: int = Field(..., description="HTTP状态码")
    error_type: Optional[str] = Field(None, description="错误类型")
    
    class Config:
        schema_extra = {
            "example": {
                "detail": "用户已存在",
                "status_code": 400,
                "error_type": "DUPLICATE_USER"
            }
        }
