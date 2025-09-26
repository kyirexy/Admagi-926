"""
FastAPI-Users 数据库模型
适配现有数据库结构
"""

from fastapi_users.db import SQLAlchemyBaseUserTableUUID, SQLAlchemyUserDatabase
from fastapi_users_db_sqlalchemy.access_token import SQLAlchemyBaseAccessTokenTableUUID
from sqlalchemy import Column, String, Boolean, Integer, DateTime, Text, ForeignKey, UUID
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PostgreSQL_UUID
from typing import Optional
from datetime import datetime
import uuid
import os

# 数据库配置
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:123456@localhost:5432/admagic")

class Base(DeclarativeBase):
    pass

# 扩展FastAPI-Users的基础用户表
# 参考: https://fastapi-users.github.io/fastapi-users/latest/configuration/model/
class User(SQLAlchemyBaseUserTableUUID, Base):
    """
    用户模型 - 继承FastAPI-Users基础模型并添加自定义字段
    """
    __tablename__ = "user"
    
    # FastAPI-Users 必需字段已由基类提供：
    # - id (UUID)
    # - email (String, unique)  
    # - hashed_password (String)
    # - is_active (Boolean)
    # - is_superuser (Boolean)
    # - is_verified (Boolean) -> 对应我们的email_verified
    
    # 自定义字段 - 对应现有数据库结构
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    username: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    avatar: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # 备用头像字段
    
    # 业务相关字段
    credits: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # 组织相关
    role: Mapped[str] = mapped_column(String(50), default='USER', nullable=False)
    plan: Mapped[str] = mapped_column(String(50), default='FREE', nullable=False) 
    org_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # 时间戳字段
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class AccessToken(SQLAlchemyBaseAccessTokenTableUUID, Base):
    """
    访问令牌模型 - FastAPI-Users JWT策略需要
    """
    __tablename__ = "access_token"

# OAuth账户模型 (如果需要社交登录)
class OAuthAccount(Base):
    """
    OAuth账户模型 - 用于社交登录
    """
    __tablename__ = "oauth_account"
    
    id: Mapped[str] = mapped_column(PostgreSQL_UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(PostgreSQL_UUID(as_uuid=False), ForeignKey("user.id"), nullable=False)
    oauth_name: Mapped[str] = mapped_column(String(100), nullable=False)  # google, github, etc.
    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    expires_at: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    refresh_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    account_id: Mapped[str] = mapped_column(String(320), nullable=False)  # OAuth提供商的用户ID
    account_email: Mapped[str] = mapped_column(String(320), nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

# 业务相关模型 - AI生成记录等
class AIGeneration(Base):
    """AI生成记录表"""
    __tablename__ = "ai_generation"
    
    id: Mapped[str] = mapped_column(PostgreSQL_UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(PostgreSQL_UUID(as_uuid=False), ForeignKey("user.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # 'image', 'text', 'video'
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    parameters: Mapped[Optional[dict]] = mapped_column(Text, nullable=True)  # JSON存储
    status: Mapped[str] = mapped_column(String(50), default='pending', nullable=False)
    cost_credits: Mapped[int] = mapped_column(Integer, nullable=False)
    result_data: Mapped[Optional[dict]] = mapped_column(Text, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

# 数据库引擎和会话
engine = create_async_engine(DATABASE_URL)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)

async def create_db_and_tables():
    """创建数据库表"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_async_session() -> AsyncSession:
    """获取异步数据库会话"""
    async with async_session_maker() as session:
        yield session

async def get_user_db(session: AsyncSession = None):
    """获取用户数据库适配器"""
    if session is None:
        async with async_session_maker() as session:
            yield SQLAlchemyUserDatabase(session, User)
    else:
        yield SQLAlchemyUserDatabase(session, User)

async def get_access_token_db(session: AsyncSession = None):
    """获取访问令牌数据库适配器"""
    if session is None:
        async with async_session_maker() as session:
            yield SQLAlchemyUserDatabase(session, AccessToken)  
    else:
        yield SQLAlchemyUserDatabase(session, AccessToken)
