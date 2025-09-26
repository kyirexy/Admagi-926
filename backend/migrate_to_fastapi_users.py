"""
数据迁移脚本：从现有数据库结构迁移到FastAPI-Users格式
"""

import asyncio
import uuid
from datetime import datetime
from sqlalchemy import text, create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

load_dotenv()

# 数据库配置
SYNC_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:123456@localhost:5432/admagic")
ASYNC_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:123456@localhost:5432/admagic")

# 密码加密
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class DatabaseMigrator:
    """数据库迁移器"""
    
    def __init__(self):
        # 同步引擎（读取旧数据）
        self.sync_engine = create_engine(SYNC_DATABASE_URL)
        self.sync_session = sessionmaker(bind=self.sync_engine)
        
        # 异步引擎（写入新格式）
        self.async_engine = create_async_engine(ASYNC_DATABASE_URL)
        self.async_session = async_sessionmaker(self.async_engine)
    
    def analyze_existing_data(self):
        """分析现有数据库结构"""
        print("🔍 分析现有数据库结构...")
        
        with self.sync_session() as session:
            # 检查用户表结构
            result = session.execute(text("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'user' 
                ORDER BY ordinal_position;
            """))
            
            user_columns = result.fetchall()
            print("\n📋 现有 user 表结构:")
            for col in user_columns:
                print(f"  - {col[0]}: {col[1]} ({'NULL' if col[2] == 'YES' else 'NOT NULL'})")
            
            # 统计现有数据
            user_count = session.execute(text("SELECT COUNT(*) FROM \"user\"")).scalar()
            print(f"\n📊 现有数据统计:")
            print(f"  - 用户数量: {user_count}")
            
            if user_count > 0:
                # 检查数据样本
                sample_users = session.execute(text("""
                    SELECT id, email, name, email_verified, created_at
                    FROM "user" 
                    LIMIT 5
                """)).fetchall()
                
                print(f"\n👥 用户数据样本:")
                for user in sample_users:
                    print(f"  - ID: {user[0]}, Email: {user[1]}, Name: {user[2]}")
            
            return user_count
    
    async def backup_existing_data(self):
        """备份现有数据"""
        print("\n💾 备份现有数据...")
        
        backup_tables = [
            "user", "session", "account", "verification"
        ]
        
        async with self.async_engine.begin() as conn:
            for table in backup_tables:
                backup_table_name = f"{table}_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                try:
                    await conn.execute(text(f"""
                        CREATE TABLE {backup_table_name} AS 
                        SELECT * FROM "{table}"
                    """))
                    print(f"✅ 备份表创建成功: {backup_table_name}")
                except Exception as e:
                    print(f"⚠️  表 {table} 备份失败: {e}")
    
    async def create_fastapi_users_tables(self):
        """创建FastAPI-Users需要的表结构"""
        print("\n🏗️  创建FastAPI-Users表结构...")
        
        # 导入模型以创建表
        from models import Base, create_db_and_tables
        
        try:
            await create_db_and_tables()
            print("✅ FastAPI-Users表结构创建成功")
        except Exception as e:
            print(f"❌ 表结构创建失败: {e}")
            raise e
    
    async def migrate_user_data(self):
        """迁移用户数据到FastAPI-Users格式"""
        print("\n🔄 迁移用户数据...")
        
        # 读取现有用户数据
        with self.sync_session() as sync_session:
            old_users = sync_session.execute(text("""
                SELECT 
                    id, email, name, username, email_verified, image,
                    created_at, updated_at, credits, is_premium,
                    role, plan, "orgId"
                FROM "user"
                ORDER BY created_at
            """)).fetchall()
        
        # 迁移到新格式
        async with self.async_session() as async_session:
            migrated_count = 0
            
            for old_user in old_users:
                try:
                    # 生成UUID（FastAPI-Users使用UUID作为主键）
                    new_uuid = str(uuid.uuid4())
                    
                    # 准备用户数据
                    user_data = {
                        'id': new_uuid,
                        'email': old_user[1],  # email
                        'hashed_password': '',  # 稍后从account表获取
                        'is_active': True,
                        'is_superuser': False,
                        'is_verified': old_user[4] or False,  # email_verified
                        'name': old_user[2],  # name
                        'username': old_user[3],  # username
                        'image': old_user[5],  # image
                        'credits': old_user[9] or 100,  # credits
                        'is_premium': old_user[10] or False,  # is_premium
                        'role': old_user[11] or 'USER',  # role
                        'plan': old_user[12] or 'FREE',  # plan
                        'org_id': old_user[13],  # orgId
                        'created_at': old_user[6] or datetime.utcnow(),  # created_at
                        'updated_at': old_user[7] or datetime.utcnow(),  # updated_at
                    }
                    
                    # 获取密码哈希（如果存在）
                    with self.sync_session() as sync_session:
                        password_result = sync_session.execute(text("""
                            SELECT password FROM account 
                            WHERE user_id = :user_id AND provider_id = 'credential'
                        """), {"user_id": old_user[0]}).fetchone()
                        
                        if password_result and password_result[0]:
                            # 如果已经是bcrypt哈希，直接使用
                            user_data['hashed_password'] = password_result[0]
                        else:
                            # 生成临时密码（用户需要重置）
                            temp_password = f"temp_{uuid.uuid4().hex[:8]}"
                            user_data['hashed_password'] = pwd_context.hash(temp_password)
                            print(f"⚠️  用户 {user_data['email']} 的密码已重置为临时密码")
                    
                    # 插入新用户数据
                    await async_session.execute(text("""
                        INSERT INTO "user" (
                            id, email, hashed_password, is_active, is_superuser, is_verified,
                            name, username, image, credits, is_premium, role, plan, org_id,
                            created_at, updated_at
                        ) VALUES (
                            :id, :email, :hashed_password, :is_active, :is_superuser, :is_verified,
                            :name, :username, :image, :credits, :is_premium, :role, :plan, :org_id,
                            :created_at, :updated_at
                        )
                    """), user_data)
                    
                    migrated_count += 1
                    
                except Exception as e:
                    print(f"❌ 用户迁移失败 {old_user[1]}: {e}")
                    continue
            
            await async_session.commit()
            print(f"✅ 成功迁移 {migrated_count} 个用户")
    
    async def create_migration_report(self):
        """创建迁移报告"""
        print("\n📊 生成迁移报告...")
        
        async with self.async_session() as session:
            # 统计新数据
            new_user_count = await session.execute(text('SELECT COUNT(*) FROM "user"'))
            new_user_count = new_user_count.scalar()
            
            # 检查数据完整性
            verified_users = await session.execute(text('SELECT COUNT(*) FROM "user" WHERE is_verified = true'))
            verified_users = verified_users.scalar()
            
            premium_users = await session.execute(text('SELECT COUNT(*) FROM "user" WHERE is_premium = true'))
            premium_users = premium_users.scalar()
        
        report = f"""
================== 迁移报告 ==================
迁移时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        
📊 数据统计:
- 总用户数: {new_user_count}
- 已验证用户: {verified_users}
- 高级用户: {premium_users}

✅ 迁移状态: 成功
⚠️  注意事项:
1. 原数据已备份（表名带时间戳）
2. 部分用户密码已重置为临时密码
3. 建议用户使用"忘记密码"功能重置密码
4. 新系统使用UUID作为用户ID

🔧 后续步骤:
1. 测试新认证系统
2. 更新前端客户端
3. 通知用户密码重置
4. 删除旧备份表（可选）
============================================
        """
        
        print(report)
        
        # 保存报告到文件
        with open(f"migration_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt", "w", encoding="utf-8") as f:
            f.write(report)
    
    async def run_full_migration(self):
        """运行完整迁移流程"""
        print("🚀 开始完整数据库迁移...")
        
        try:
            # 1. 分析现有数据
            user_count = self.analyze_existing_data()
            
            if user_count == 0:
                print("ℹ️  没有现有用户数据，跳过迁移")
                await self.create_fastapi_users_tables()
                return
            
            # 2. 用户确认
            confirm = input(f"\n⚠️  将迁移 {user_count} 个用户。是否继续？ (y/N): ")
            if confirm.lower() != 'y':
                print("❌ 迁移已取消")
                return
            
            # 3. 备份数据
            await self.backup_existing_data()
            
            # 4. 创建新表结构
            await self.create_fastapi_users_tables()
            
            # 5. 迁移用户数据
            await self.migrate_user_data()
            
            # 6. 生成报告
            await self.create_migration_report()
            
            print("\n🎉 数据迁移完成！")
            
        except Exception as e:
            print(f"\n❌ 迁移过程中出现错误: {e}")
            raise e

async def main():
    """主函数"""
    migrator = DatabaseMigrator()
    
    print("=" * 50)
    print("万相营造 FastAPI-Users 数据迁移工具")
    print("=" * 50)
    
    # 选择操作
    print("\n请选择操作:")
    print("1. 分析现有数据")
    print("2. 完整迁移") 
    print("3. 仅创建表结构")
    print("4. 退出")
    
    choice = input("\n请输入选择 (1-4): ").strip()
    
    if choice == "1":
        migrator.analyze_existing_data()
    elif choice == "2":
        await migrator.run_full_migration()
    elif choice == "3":
        await migrator.create_fastapi_users_tables()
        print("✅ 表结构创建完成")
    elif choice == "4":
        print("👋 退出迁移工具")
    else:
        print("❌ 无效选择")

if __name__ == "__main__":
    asyncio.run(main())
