"""
认证服务模块
基于现有数据库结构实现FastAPI-Users兼容的认证功能
"""

from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional, Union
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import uuid
import os

from models_adapted import User, Session as DBSession, UserRole, UserPlan
from schemas_adapted import UserCreate, UserResponse, Token, TokenData

# 密码加密上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT配置
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_LIFETIME_SECONDS", "3600")) // 60

class AuthService:
    """认证服务类"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # ========== 密码相关方法 ==========
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """验证密码"""
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            print(f"密码验证异常: {e}")
            return False
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """生成密码哈希"""
        return pwd_context.hash(password)
    
    # ========== 用户管理方法 ==========
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """通过邮箱获取用户"""
        return self.db.query(User).filter(User.email == email).first()
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """通过ID获取用户"""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def create_user(self, user_create: UserCreate) -> User:
        """创建新用户"""
        # 检查邮箱是否已存在
        if self.get_user_by_email(user_create.email):
            raise ValueError("邮箱已被注册")
        
        # 生成密码哈希
        hashed_password = self.get_password_hash(user_create.password)
        
        # 创建用户对象
        db_user = User(
            id=str(uuid.uuid4()),
            email=user_create.email,
            name=user_create.name,
            image=user_create.image,
            password_hash=hashed_password,
            emailVerified=False,  # 新用户邮箱未验证
            role=UserRole.USER,
            plan=UserPlan.FREE,
            createdAt=datetime.utcnow(),
            updatedAt=datetime.utcnow()
        )
        
        # 保存到数据库
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        
        return db_user
    
    def authenticate_user(self, email: str, password: str) -> Union[User, bool]:
        """验证用户身份"""
        user = self.get_user_by_email(email)
        if not user:
            return False
        
        # 检查密码（兼容旧password字段和新password_hash字段）
        stored_password = user.hashed_password
        if not stored_password:
            return False
            
        if not self.verify_password(password, stored_password):
            return False
            
        return user
    
    def update_user(self, user_id: str, **kwargs) -> Optional[User]:
        """更新用户信息"""
        user = self.get_user_by_id(user_id)
        if not user:
            return None
            
        # 更新字段
        for key, value in kwargs.items():
            if hasattr(user, key) and value is not None:
                setattr(user, key, value)
        
        user.updatedAt = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    # ========== JWT令牌方法 ==========
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """创建访问令牌"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Optional[TokenData]:
        """验证令牌"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            email: str = payload.get("email")
            
            if user_id is None:
                return None
                
            return TokenData(user_id=user_id, email=email)
            
        except JWTError:
            return None
    
    def create_user_token(self, user: User) -> Token:
        """为用户创建访问令牌"""
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token_data = {
            "sub": user.id,
            "email": user.email,
            "role": user.role.value
        }
        
        access_token = self.create_access_token(
            data=access_token_data,
            expires_delta=access_token_expires
        )
        
        # 保存会话到数据库（可选）
        self.create_session(user.id, access_token)
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    
    # ========== 会话管理方法 ==========
    
    def create_session(self, user_id: str, token: str, expires_at: Optional[datetime] = None) -> DBSession:
        """创建用户会话"""
        if not expires_at:
            expires_at = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        session = DBSession(
            id=str(uuid.uuid4()),
            userId=user_id,
            token=token,
            expiresAt=expires_at,
            createdAt=datetime.utcnow(),
            updatedAt=datetime.utcnow()
        )
        
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        
        return session
    
    def get_session_by_token(self, token: str) -> Optional[DBSession]:
        """通过令牌获取会话"""
        return self.db.query(DBSession).filter(
            DBSession.token == token,
            DBSession.expiresAt > datetime.utcnow()
        ).first()
    
    def revoke_session(self, token: str) -> bool:
        """撤销会话"""
        session = self.db.query(DBSession).filter(DBSession.token == token).first()
        if session:
            self.db.delete(session)
            self.db.commit()
            return True
        return False
    
    def cleanup_expired_sessions(self) -> int:
        """清理过期会话"""
        expired_count = self.db.query(DBSession).filter(
            DBSession.expiresAt < datetime.utcnow()
        ).count()
        
        self.db.query(DBSession).filter(
            DBSession.expiresAt < datetime.utcnow()
        ).delete()
        
        self.db.commit()
        return expired_count

# ========== FastAPI依赖注入函数 ==========

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models_adapted import get_db

# HTTP Bearer认证
security = HTTPBearer()

def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    """获取认证服务实例"""
    return AuthService(db)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> User:
    """获取当前认证用户"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_data = auth_service.verify_token(credentials.credentials)
    if token_data is None or token_data.user_id is None:
        raise credentials_exception
    
    user = auth_service.get_user_by_id(token_data.user_id)
    if user is None:
        raise credentials_exception
    
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """获取当前活跃用户"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_current_superuser(current_user: User = Depends(get_current_user)) -> User:
    """获取当前超级用户"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

# ========== 测试函数 ==========

def test_auth_service():
    """测试认证服务"""
    from models_adapted import SessionLocal
    
    print("🧪 测试认证服务...")
    
    db = SessionLocal()
    auth_service = AuthService(db)
    
    try:
        # 测试密码哈希
        password = "test123456"
        hashed = auth_service.get_password_hash(password)
        print(f"✅ 密码哈希生成: {hashed[:20]}...")
        
        # 验证密码
        is_valid = auth_service.verify_password(password, hashed)
        print(f"✅ 密码验证: {is_valid}")
        
        # 测试获取现有用户
        existing_users = db.query(User).limit(1).all()
        if existing_users:
            user = existing_users[0]
            print(f"✅ 获取用户: {user.email}")
            
            # 创建令牌
            token = auth_service.create_user_token(user)
            print(f"✅ 创建令牌: {token.access_token[:20]}...")
            
            # 验证令牌
            token_data = auth_service.verify_token(token.access_token)
            print(f"✅ 验证令牌: {token_data.user_id if token_data else None}")
        
        print("✅ 认证服务测试完成")
        
    except Exception as e:
        print(f"❌ 认证服务测试失败: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_auth_service()
