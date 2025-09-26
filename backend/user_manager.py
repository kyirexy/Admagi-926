"""
FastAPI-Users 用户管理器配置
处理用户注册、验证、密码重置等逻辑
"""

import uuid
from typing import Optional, Dict, Any
from fastapi import Depends, Request
from fastapi_users import BaseUserManager, UUIDIDMixin
from fastapi_users.db import SQLAlchemyUserDatabase

from models import User, get_user_db
from email_service import EmailService
import os
from dotenv import load_dotenv

load_dotenv()

# 密钥配置
SECRET = os.getenv("SECRET_KEY", "fastapi-users-secret-change-in-production")

class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    """
    自定义用户管理器
    参考: https://fastapi-users.github.io/fastapi-users/latest/configuration/user-manager/
    """
    reset_password_token_secret = SECRET
    verification_token_secret = SECRET

    def __init__(self, user_db: SQLAlchemyUserDatabase, email_service: EmailService):
        super().__init__(user_db)
        self.email_service = email_service

    async def on_after_register(self, user: User, request: Optional[Request] = None):
        """
        用户注册后的回调
        发送欢迎邮件
        """
        print(f"✅ 用户注册成功: {user.email}")
        
        # 发送欢迎邮件
        try:
            await self.email_service.send_welcome_email(
                to_email=user.email,
                user_name=user.name or user.email.split('@')[0]
            )
            print(f"✅ 欢迎邮件已发送给: {user.email}")
        except Exception as e:
            print(f"❌ 欢迎邮件发送失败: {e}")
            # 不阻断注册流程

    async def on_after_login(
        self, 
        user: User, 
        request: Optional[Request] = None,
        response = None
    ):
        """
        用户登录后的回调
        """
        print(f"✅ 用户登录成功: {user.email}")
        
        # 记录登录日志
        if request:
            print(f"登录IP: {request.client.host if request.client else 'unknown'}")

    async def on_after_forgot_password(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        """
        密码重置请求后的回调
        发送重置密码邮件
        """
        print(f"🔐 用户请求密码重置: {user.email}")
        
        # 构建重置密码URL
        base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        reset_url = f"{base_url}/reset-password?token={token}"
        
        try:
            await self.email_service.send_reset_password_email(
                to_email=user.email,
                user_name=user.name or user.email.split('@')[0],
                reset_url=reset_url,
                token=token
            )
            print(f"✅ 重置密码邮件已发送给: {user.email}")
        except Exception as e:
            print(f"❌ 重置密码邮件发送失败: {e}")
            raise e

    async def on_after_request_verify(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        """
        请求邮箱验证后的回调
        发送验证邮件
        """
        print(f"📧 用户请求邮箱验证: {user.email}")
        
        # 构建验证URL
        base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        verify_url = f"{base_url}/api/auth/verify?token={token}"
        
        try:
            await self.email_service.send_verification_email(
                to_email=user.email,
                user_name=user.name or user.email.split('@')[0],
                verification_url=verify_url,
                token=token
            )
            print(f"✅ 验证邮件已发送给: {user.email}")
        except Exception as e:
            print(f"❌ 验证邮件发送失败: {e}")
            raise e

    async def on_after_verify(
        self, user: User, request: Optional[Request] = None
    ):
        """
        邮箱验证成功后的回调
        """
        print(f"✅ 用户邮箱验证成功: {user.email}")
        
        # 可以添加验证成功后的业务逻辑
        # 比如发送验证成功通知邮件、赠送积分等

    async def on_after_update(
        self,
        user: User,
        update_dict: Dict[str, Any],
        request: Optional[Request] = None,
    ):
        """
        用户信息更新后的回调
        """
        print(f"📝 用户信息更新: {user.email}")
        print(f"更新字段: {list(update_dict.keys())}")

    async def create(
        self,
        user_create,
        safe: bool = False,
        request: Optional[Request] = None,
    ) -> User:
        """
        重写用户创建方法，添加自定义逻辑
        """
        # 处理用户名生成
        if not user_create.username:
            # 从邮箱生成默认用户名
            username_base = user_create.email.split('@')[0]
            user_create.username = username_base
        
        # 调用父类的创建方法
        user = await super().create(user_create, safe=safe, request=request)
        
        # 添加额外的自定义逻辑
        print(f"🆕 新用户创建: {user.email}")
        
        return user

    async def validate_password(
        self,
        password: str,
        user: User = None,
    ) -> None:
        """
        自定义密码验证规则
        """
        if len(password) < 6:
            raise ValueError("密码长度至少需要6位")
        
        if len(password) > 128:
            raise ValueError("密码长度不能超过128位")
        
        # 检查密码强度
        if password.lower() == password:
            print("⚠️ 建议密码包含大小写字母")
        
        if not any(c.isdigit() for c in password):
            print("⚠️ 建议密码包含数字")
        
        # 检查是否与邮箱相同
        if user and user.email.split('@')[0].lower() in password.lower():
            raise ValueError("密码不能包含邮箱用户名")

# 获取用户管理器的依赖注入函数
async def get_user_manager(user_db: SQLAlchemyUserDatabase = Depends(get_user_db)):
    """获取用户管理器实例"""
    email_service = EmailService()
    yield UserManager(user_db, email_service)
