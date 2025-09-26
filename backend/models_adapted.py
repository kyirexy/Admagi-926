"""
适配现有数据库结构的FastAPI-Users兼容模型
基于您现有的PostgreSQL数据库结构创建
"""

from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from typing import Optional

# 创建基类
Base = declarative_base()

# 定义Python Enum类型，对应数据库中的ENUM
class UserRole(str, enum.Enum):
    """用户角色枚举 - 对应数据库Role类型"""
    USER = "USER"
    ADMIN = "ADMIN"
    DESIGNER = "DESIGNER"

class UserPlan(str, enum.Enum):
    """用户计划枚举 - 对应数据库Plan类型"""
    FREE = "FREE"
    PRO = "PRO"
    ENTERPRISE = "ENTERPRISE"

class User(Base):
    """
    用户模型 - 适配现有数据库user表结构
    兼容FastAPI-Users接口，但使用现有数据库字段名
    """
    __tablename__ = "user"
    
    # 主键 - 现有数据库使用text类型的UUID
    id = Column(String, primary_key=True)
    
    # 基础认证信息
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=True)  # 原有字段
    password_hash = Column(String, nullable=True)  # 新增字段，用于存储bcrypt哈希
    
    # FastAPI-Users兼容字段（映射到现有字段）
    emailVerified = Column("emailVerified", Boolean, default=False, nullable=False)  # 现有字段名
    
    # 用户基本信息
    name = Column(String, nullable=True)
    image = Column(String, nullable=True)
    
    # 业务相关字段
    role = Column(SQLEnum(UserRole, name="Role"), default=UserRole.USER, nullable=False)
    plan = Column(SQLEnum(UserPlan, name="Plan"), default=UserPlan.FREE, nullable=False)
    orgId = Column("orgId", String, ForeignKey("organizations.id"), nullable=True)
    
    # 时间戳
    createdAt = Column("createdAt", DateTime, default=func.now(), nullable=False)
    updatedAt = Column("updatedAt", DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    
    # 关系
    organization = relationship("Organization", back_populates="users", lazy="select")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan", lazy="select")
    accounts = relationship("Account", back_populates="user", cascade="all, delete-orphan", lazy="select")
    api_keys = relationship("APIKey", back_populates="user", cascade="all, delete-orphan", lazy="select")
    
    # FastAPI-Users兼容属性
    @property
    def is_verified(self) -> bool:
        """FastAPI-Users兼容属性：邮箱是否验证"""
        return self.emailVerified or False
    
    @is_verified.setter
    def is_verified(self, value: bool):
        """设置邮箱验证状态"""
        self.emailVerified = value
    
    @property
    def is_active(self) -> bool:
        """FastAPI-Users兼容属性：用户是否活跃"""
        # 基于现有逻辑，所有用户默认都是活跃的
        return True
    
    @property
    def is_superuser(self) -> bool:
        """FastAPI-Users兼容属性：是否超级用户"""
        return self.role == UserRole.ADMIN
    
    @property
    def hashed_password(self) -> Optional[str]:
        """FastAPI-Users兼容属性：哈希密码"""
        return self.password_hash or self.password
    
    @hashed_password.setter
    def hashed_password(self, value: str):
        """设置哈希密码"""
        self.password_hash = value
    
    def __repr__(self):
        return f"<User(id='{self.id}', email='{self.email}', role='{self.role}')>"

class Organization(Base):
    """组织模型 - 对应现有organizations表"""
    __tablename__ = "organizations"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    billingInfo = Column("billingInfo", Text, nullable=True)  # JSONB字段
    createdAt = Column("createdAt", DateTime, default=func.now(), nullable=False)
    
    # 关系
    users = relationship("User", back_populates="organization", lazy="select")

class Session(Base):
    """会话模型 - 对应现有session表"""
    __tablename__ = "session"
    
    id = Column(String, primary_key=True)
    userId = Column("userId", String, ForeignKey("user.id"), nullable=False)
    expiresAt = Column("expiresAt", DateTime, nullable=False)
    token = Column(String, unique=True, nullable=False)
    createdAt = Column("createdAt", DateTime, default=func.now(), nullable=False)
    updatedAt = Column("updatedAt", DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    ipAddress = Column("ipAddress", String, nullable=True)
    userAgent = Column("userAgent", String, nullable=True)
    
    # 关系
    user = relationship("User", back_populates="sessions")

class Account(Base):
    """账户模型 - 对应现有account表（用于OAuth）"""
    __tablename__ = "account"
    
    id = Column(String, primary_key=True)
    userId = Column("userId", String, ForeignKey("user.id"), nullable=False)
    accountId = Column("accountId", String, nullable=False)
    providerId = Column("providerId", String, nullable=False)
    accessToken = Column("accessToken", Text, nullable=True)
    refreshToken = Column("refreshToken", Text, nullable=True)
    idToken = Column("idToken", Text, nullable=True)
    accessTokenExpiresAt = Column("accessTokenExpiresAt", DateTime, nullable=True)
    refreshTokenExpiresAt = Column("refreshTokenExpiresAt", DateTime, nullable=True)
    scope = Column(String, nullable=True)
    password = Column(String, nullable=True)
    createdAt = Column("createdAt", DateTime, default=func.now(), nullable=False)
    updatedAt = Column("updatedAt", DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    
    # 关系
    user = relationship("User", back_populates="accounts")

class Verification(Base):
    """验证模型 - 对应现有verification表"""
    __tablename__ = "verification"
    
    id = Column(String, primary_key=True)
    identifier = Column(String, nullable=False)
    value = Column(String, nullable=False)
    expiresAt = Column("expiresAt", DateTime, nullable=False)
    createdAt = Column("createdAt", DateTime, default=func.now(), nullable=False)
    updatedAt = Column("updatedAt", DateTime, default=func.now(), onupdate=func.now(), nullable=False)

class APIKey(Base):
    """API密钥模型 - 对应现有api_keys表"""
    __tablename__ = "api_keys"
    
    id = Column(String, primary_key=True)
    userId = Column("userId", String, ForeignKey("user.id"), nullable=False)
    name = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    apiKey = Column("apiKey", String, nullable=False)
    baseUrl = Column("baseUrl", String, nullable=True)
    region = Column(String, nullable=True)
    isActive = Column("isActive", Boolean, default=True, nullable=True)
    lastUsed = Column("lastUsed", DateTime, nullable=True)
    createdAt = Column("createdAt", DateTime, default=func.now(), nullable=True)
    updatedAt = Column("updatedAt", DateTime, default=func.now(), onupdate=func.now(), nullable=True)
    
    # 关系
    user = relationship("User", back_populates="api_keys")

# FastAPI-Users兼容的用户创建函数
def create_fastapi_users_compatible_user(
    email: str,
    hashed_password: str,
    name: Optional[str] = None,
    is_verified: bool = False,
    role: UserRole = UserRole.USER,
    plan: UserPlan = UserPlan.FREE
) -> User:
    """
    创建兼容FastAPI-Users的用户
    使用现有数据库结构
    """
    import uuid
    
    user = User(
        id=str(uuid.uuid4()),
        email=email,
        password_hash=hashed_password,
        name=name,
        emailVerified=is_verified,
        role=role,
        plan=plan,
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow()
    )
    
    return user

# 数据库连接配置（使用SQLAlchemy）
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# 数据库URL配置
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:123456@localhost:5432/admagic")

# 创建引擎
engine = create_engine(DATABASE_URL, echo=True)  # echo=True用于开发调试

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 依赖注入函数
def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 测试数据库连接
def test_model_connection():
    """测试模型与数据库连接"""
    try:
        db = SessionLocal()
        
        # 查询现有用户
        users = db.query(User).limit(5).all()
        print(f"✅ 成功查询到 {len(users)} 个用户")
        
        for user in users:
            print(f"  - 用户: {user.email} (角色: {user.role}, 计划: {user.plan})")
            print(f"    FastAPI-Users兼容属性:")
            print(f"      is_verified: {user.is_verified}")
            print(f"      is_active: {user.is_active}")
            print(f"      is_superuser: {user.is_superuser}")
            print(f"      hashed_password存在: {bool(user.hashed_password)}")
            
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ 模型测试失败: {e}")
        return False

if __name__ == "__main__":
    print("🧪 测试适配后的数据库模型...")
    success = test_model_connection()
    
    if success:
        print("🎉 模型适配成功！兼容FastAPI-Users接口。")
    else:
        print("💥 模型适配失败！需要调试。")
