"""
验证token管理模块
用于管理邮箱验证和密码重置的token
"""

from sqlalchemy import Column, String, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
import hashlib
from models_adapted import Base

class VerificationToken(Base):
    """验证token表"""
    __tablename__ = "verification_tokens"
    
    id = Column(String, primary_key=True, default=lambda: secrets.token_urlsafe(32))
    email = Column(String, nullable=False, index=True)
    token = Column(String, nullable=False, unique=True, index=True)
    token_type = Column(String, nullable=False)  # 'email_verification' 或 'password_reset'
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class TokenManager:
    """Token管理器"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_email_verification_token(self, email: str, expires_hours: int = 24) -> str:
        """创建邮箱验证token"""
        # 生成安全的token
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(f"{email}:{raw_token}:{datetime.utcnow()}".encode()).hexdigest()
        
        # 删除该邮箱的旧token
        self.db.query(VerificationToken).filter(
            VerificationToken.email == email,
            VerificationToken.token_type == "email_verification"
        ).delete()
        
        # 创建新token
        verification_token = VerificationToken(
            email=email,
            token=token_hash,
            token_type="email_verification",
            expires_at=datetime.utcnow() + timedelta(hours=expires_hours)
        )
        
        self.db.add(verification_token)
        self.db.commit()
        
        return token_hash
    
    def create_password_reset_token(self, email: str, expires_hours: int = 1) -> str:
        """创建密码重置token"""
        # 生成安全的token
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(f"{email}:{raw_token}:{datetime.utcnow()}".encode()).hexdigest()
        
        # 删除该邮箱的旧token
        self.db.query(VerificationToken).filter(
            VerificationToken.email == email,
            VerificationToken.token_type == "password_reset"
        ).delete()
        
        # 创建新token
        reset_token = VerificationToken(
            email=email,
            token=token_hash,
            token_type="password_reset",
            expires_at=datetime.utcnow() + timedelta(hours=expires_hours)
        )
        
        self.db.add(reset_token)
        self.db.commit()
        
        return token_hash
    
    def verify_token(self, token: str, token_type: str) -> tuple[bool, str]:
        """验证token"""
        verification_token = self.db.query(VerificationToken).filter(
            VerificationToken.token == token,
            VerificationToken.token_type == token_type,
            VerificationToken.used == False
        ).first()
        
        if not verification_token:
            return False, "无效的验证码"
        
        if verification_token.expires_at < datetime.utcnow():
            return False, "验证码已过期"
        
        return True, verification_token.email
    
    def mark_token_used(self, token: str) -> bool:
        """标记token为已使用"""
        verification_token = self.db.query(VerificationToken).filter(
            VerificationToken.token == token
        ).first()
        
        if verification_token:
            verification_token.used = True
            self.db.commit()
            return True
        
        return False
    
    def cleanup_expired_tokens(self):
        """清理过期的token"""
        expired_count = self.db.query(VerificationToken).filter(
            VerificationToken.expires_at < datetime.utcnow()
        ).delete()
        
        self.db.commit()
        print(f"🧹 清理了 {expired_count} 个过期token")
        return expired_count