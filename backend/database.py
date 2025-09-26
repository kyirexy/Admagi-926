"""
数据库连接和模型配置
"""

from sqlalchemy import create_engine, Column, String, DateTime, Boolean, Text, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 数据库URL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:123456@localhost:5432/admagic")

# 创建数据库引擎
engine = create_engine(DATABASE_URL)

# 创建会话
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基类
Base = declarative_base()

# 用户模型
class User(Base):
    __tablename__ = "user"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    emailVerified = Column(Boolean, default=False, nullable=False)  # 匹配实际数据库结构
    name = Column(String, nullable=True)  # 实际表中允许为空
    image = Column(String, nullable=True)
    password = Column(String, nullable=True)  # 实际表中的password字段
    role = Column(String, nullable=False, default='USER')  # 用户角色
    plan = Column(String, nullable=False, default='FREE')  # 用户计划
    orgId = Column(String, nullable=True)  # 组织ID
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    password_hash = Column(String, nullable=True)  # 我们添加的字段

# 账户模型
class Account(Base):
    __tablename__ = "account"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False)
    account_id = Column(String, nullable=False)
    provider_id = Column(String, nullable=False)
    provider_type = Column(String, nullable=False)
    access_token = Column(Text)
    refresh_token = Column(Text)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 会话模型
class Session(Base):
    __tablename__ = "session"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId = Column(String, nullable=False)  # 匹配实际数据库字段名
    expiresAt = Column(DateTime, nullable=False)  # 匹配实际数据库字段名
    token = Column(String, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    ipAddress = Column(String, nullable=True)  # 匹配实际数据库字段名
    userAgent = Column(String, nullable=True)  # 匹配实际数据库字段名

# 验证模型
class Verification(Base):
    __tablename__ = "verification"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    identifier = Column(String, nullable=False)
    value = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 获取数据库会话
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 创建所有表
def create_tables():
    Base.metadata.create_all(bind=engine)

# 测试数据库连接
def test_connection():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            return True
    except Exception as e:
        print(f"数据库连接失败: {e}")
        return False

if __name__ == "__main__":
    print("测试数据库连接...")
    if test_connection():
        print("✅ 数据库连接成功")
        print("创建数据库表...")
        create_tables()
        print("✅ 数据库表创建完成")
    else:
        print("❌ 数据库连接失败")