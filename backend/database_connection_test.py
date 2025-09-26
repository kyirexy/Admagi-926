"""
数据库连接验证脚本
基于现有PostgreSQL数据库结构
"""

import asyncio
import asyncpg
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

async def test_database_connection():
    """测试数据库连接和基本查询"""
    
    # 数据库连接配置
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:123456@localhost:5432/admagic")
    
    try:
        # 解析连接URL
        if DATABASE_URL.startswith("postgresql+asyncpg://"):
            db_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
        else:
            db_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://") if "asyncpg" in DATABASE_URL else DATABASE_URL
            
        print("🔗 正在连接数据库...")
        print(f"连接URL: {db_url.replace(':123456', ':****')}")  # 隐藏密码
        
        # 建立连接
        conn = await asyncpg.connect(db_url)
        print("✅ 数据库连接成功")
        
        # 测试基本查询
        version = await conn.fetchval('SELECT version()')
        print(f"📊 PostgreSQL版本: {version}")
        
        # 检查现有用户表结构
        print("\n🔍 检查现有数据库结构...")
        
        # 检查用户表
        user_table_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'user'
            )
        """)
        
        if user_table_exists:
            print("✅ user表存在")
            
            # 获取用户表字段信息
            columns = await conn.fetch("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'user' AND table_schema = 'public'
                ORDER BY ordinal_position
            """)
            
            print("📋 user表字段结构:")
            for col in columns:
                nullable = "NULL" if col['is_nullable'] == 'YES' else "NOT NULL"
                default = f" DEFAULT {col['column_default']}" if col['column_default'] else ""
                print(f"  - {col['column_name']}: {col['data_type']} {nullable}{default}")
                
            # 统计用户数量
            user_count = await conn.fetchval('SELECT COUNT(*) FROM "user"')
            print(f"👥 现有用户数量: {user_count}")
            
            # 检查用户数据示例
            if user_count > 0:
                sample_user = await conn.fetchrow("""
                    SELECT id, email, "emailVerified", name, role, plan, "createdAt" 
                    FROM "user" 
                    LIMIT 1
                """)
                print("👤 用户数据示例:")
                for key, value in sample_user.items():
                    print(f"  - {key}: {value}")
        else:
            print("❌ user表不存在")
            
        # 检查其他重要表
        important_tables = ['session', 'account', 'verification', 'organizations']
        print(f"\n🔍 检查其他重要表...")
        
        for table_name in important_tables:
            exists = await conn.fetchval(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = '{table_name}'
                )
            """)
            status = "✅" if exists else "❌"
            print(f"  {status} {table_name}表: {'存在' if exists else '不存在'}")
            
        # 检查ENUM类型
        print(f"\n🔍 检查自定义ENUM类型...")
        enum_types = ['Role', 'Plan']
        
        for enum_type in enum_types:
            enum_values = await conn.fetch("""
                SELECT enumlabel 
                FROM pg_enum e
                JOIN pg_type t ON e.enumtypid = t.oid
                WHERE t.typname = $1
                ORDER BY e.enumsortorder
            """, enum_type)
            
            if enum_values:
                values = [row['enumlabel'] for row in enum_values]
                print(f"  ✅ {enum_type}: {', '.join(values)}")
            else:
                print(f"  ❌ {enum_type}: 未找到")
        
        # 关闭连接
        await conn.close()
        print("\n✅ 数据库连接验证完成")
        return True
        
    except Exception as e:
        print(f"❌ 数据库连接失败: {e}")
        return False

async def main():
    """主函数"""
    print("=" * 60)
    print("万相营造 数据库连接验证")
    print("=" * 60)
    
    success = await test_database_connection()
    
    if success:
        print("\n🎉 数据库验证成功！可以继续下一步开发。")
    else:
        print("\n💥 数据库验证失败！请检查数据库配置。")
    
    return success

if __name__ == "__main__":
    asyncio.run(main())
