"""
FastAPI-Users 认证后端配置
包括JWT策略、Cookie策略等
"""

import uuid
from fastapi_users import FastAPIUsers
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    CookieTransport,
    JWTStrategy,
)
from models import User
from user_manager import get_user_manager
import os
from dotenv import load_dotenv

load_dotenv()

# 配置参数
SECRET = os.getenv("SECRET_KEY", "fastapi-users-secret-change-in-production")
JWT_LIFETIME_SECONDS = int(os.getenv("JWT_LIFETIME_SECONDS", "3600"))  # 1小时
COOKIE_MAX_AGE = int(os.getenv("COOKIE_MAX_AGE", "86400"))  # 24小时

# Bearer Token 传输配置
bearer_transport = BearerTransport(tokenUrl="api/auth/jwt/login")

# Cookie 传输配置 
cookie_transport = CookieTransport(
    cookie_max_age=COOKIE_MAX_AGE,
    cookie_name="admagic_auth",
    cookie_secure=os.getenv("NODE_ENV") == "production",
    cookie_httponly=True,
    cookie_samesite="lax"
)

# JWT 策略配置
def get_jwt_strategy() -> JWTStrategy:
    """获取JWT策略"""
    return JWTStrategy(
        secret=SECRET, 
        lifetime_seconds=JWT_LIFETIME_SECONDS,
        algorithm="HS256"
    )

# 认证后端配置
jwt_auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

cookie_auth_backend = AuthenticationBackend(
    name="cookie", 
    transport=cookie_transport,
    get_strategy=get_jwt_strategy,
)

# 创建FastAPIUsers实例
fastapi_users = FastAPIUsers[User, uuid.UUID](
    get_user_manager,
    [jwt_auth_backend, cookie_auth_backend],  # 支持多种认证方式
)

# 获取当前用户的依赖注入
current_user = fastapi_users.current_user()
current_active_user = fastapi_users.current_user(active=True)
current_verified_user = fastapi_users.current_user(active=True, verified=True)
current_superuser = fastapi_users.current_user(active=True, superuser=True)

# 可选的用户依赖
optional_current_user = fastapi_users.current_user(optional=True)
optional_current_active_user = fastapi_users.current_user(optional=True, active=True)

# 用于不同场景的用户获取函数
def get_current_user_dependency(
    active: bool = True,
    verified: bool = False, 
    superuser: bool = False,
    optional: bool = False
):
    """
    动态创建用户依赖注入函数
    
    Args:
        active: 是否需要用户激活
        verified: 是否需要邮箱验证
        superuser: 是否需要超级管理员权限
        optional: 是否可选（允许未认证用户）
    """
    return fastapi_users.current_user(
        active=active if not optional else None,
        verified=verified if not optional else None,
        superuser=superuser if not optional else None,
        optional=optional
    )
