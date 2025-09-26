"""
纯粹的FastAPI-Users兼容架构定义
移除Better Auth兼容层，专注标准FastAPI-Users实现
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from models_adapted import UserRole, UserPlan

# ========== FastAPI-Users标准架构 ==========

class UserRead(BaseModel):
    """
    用户读取架构 - FastAPI-Users标准格式
    """
    id: str
    email: EmailStr
    name: Optional[str] = None
    image: Optional[str] = None
    
    # FastAPI-Users标准字段
    is_active: bool = True
    is_superuser: bool = False
    is_verified: bool = False
    
    # 业务扩展字段
    role: UserRole
    plan: UserPlan
    orgId: Optional[str] = None
    
    # 时间戳
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "f595ad84-d102-44e8-b626-636a6aab3b65",
                "email": "user@example.com",
                "name": "用户姓名",
                "image": "https://example.com/avatar.jpg",
                "is_active": True,
                "is_superuser": False,
                "is_verified": True,
                "role": "USER",
                "plan": "FREE",
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        }

class UserCreate(BaseModel):
    """
    用户创建架构 - FastAPI-Users标准格式
    """
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    name: str = Field(..., min_length=1, max_length=255)
    image: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "password123",
                "name": "用户姓名",
                "image": "https://example.com/avatar.jpg"
            }
        }

class UserUpdate(BaseModel):
    """
    用户更新架构 - FastAPI-Users标准格式
    """
    email: Optional[EmailStr] = None
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    image: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6, max_length=128)
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "新姓名",
                "image": "https://example.com/avatar.jpg"
            }
        }

# ========== 认证相关架构 ==========

class Token(BaseModel):
    """JWT令牌响应 - FastAPI-Users标准格式"""
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    """JWT令牌数据"""
    user_id: Optional[str] = None
    email: Optional[str] = None

class LoginForm(BaseModel):
    """登录表单 - FastAPI-Users标准格式"""
    username: EmailStr = Field(..., description="邮箱地址")
    password: str

# ========== 邮件相关架构 ==========

class EmailVerificationRequest(BaseModel):
    """邮箱验证请求"""
    email: EmailStr

class PasswordResetRequest(BaseModel):
    """密码重置请求"""
    email: EmailStr

class PasswordReset(BaseModel):
    """密码重置"""
    token: str
    password: str = Field(..., min_length=6, max_length=128)

class VerifyEmailRequest(BaseModel):
    """请求验证邮件"""
    email: EmailStr

class VerifyEmailConfirm(BaseModel):
    """确认邮箱验证"""
    token: str

# ========== 系统相关架构 ==========

class HealthResponse(BaseModel):
    """健康检查响应"""
    status: str = "healthy"
    service: str = "AdMagic FastAPI-Users Backend"
    version: str = "2.0.0"
    auth_system: str = "FastAPI-Users"
    database: str = "PostgreSQL"
    features: dict = {
        "user_registration": "✅",
        "email_verification": "✅", 
        "password_reset": "✅",
        "jwt_auth": "✅",
        "user_management": "✅"
    }

class ErrorResponse(BaseModel):
    """标准错误响应"""
    detail: str
    status_code: Optional[int] = None
    error_type: Optional[str] = None

# ========== 业务相关架构 ==========

class UserCreditsUpdate(BaseModel):
    """用户积分更新"""
    credits: int = Field(..., ge=0)
    reason: str

class UserPlanUpdate(BaseModel):
    """用户计划更新"""
    plan: UserPlan

# ========== 验证和测试 ==========

def test_schemas():
    """测试FastAPI-Users架构"""
    print("🧪 测试FastAPI-Users标准架构...")
    
    try:
        # 测试用户创建
        user_create = UserCreate(
            email="test@example.com",
            password="test123456",
            name="测试用户"
        )
        print(f"✅ 用户创建架构: {user_create.model_dump()}")
        
        # 测试登录表单
        login_form = LoginForm(
            username="test@example.com",
            password="test123456"
        )
        print(f"✅ 登录表单架构: {login_form.model_dump()}")
        
        # 测试令牌响应
        token = Token(
            access_token="test-token-123",
            token_type="bearer"
        )
        print(f"✅ 令牌响应架构: {token.model_dump()}")
        
        print("✅ FastAPI-Users架构测试完成")
        
    except Exception as e:
        print(f"❌ 架构测试失败: {e}")

if __name__ == "__main__":
    test_schemas()
