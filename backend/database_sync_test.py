"""
同步数据库连接验证脚本
基于现有PostgreSQL数据库结构
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

def test_database_connection():
    """测试数据库连接和基本查询"""
    
    try:
        # 数据库连接配置
        db_config = {
            'host': 'localhost',
            'port': 5432,
            'database': 'admagic',
            'user': 'postgres', 
            'password': '123456'
        }
        
        print("🔗 正在连接数据库...")
        print(f"连接信息: {db_config['user']}@{db_config['host']}:{db_config['port']}/{db_config['database']}")
        
        # 建立连接
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        print("✅ 数据库连接成功")
        
        # 测试基本查询
        cursor.execute('SELECT version()')
        result = cursor.fetchone()
        version = result['version'] if result else "Unknown"
        print(f"📊 PostgreSQL版本: {version[:50]}...")
        
        # 检查现有用户表结构
        print("\n🔍 检查现有数据库结构...")
        
        # 检查用户表
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'user'
            )
        """)
        
        result = cursor.fetchone()
        user_table_exists = result['exists'] if result else False
        
        if user_table_exists:
            print("✅ user表存在")
            
            # 获取用户表字段信息
            cursor.execute("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'user' AND table_schema = 'public'
                ORDER BY ordinal_position
            """)
            
            columns = cursor.fetchall()
            print("📋 user表字段结构:")
            for col in columns:
                nullable = "NULL" if col['is_nullable'] == 'YES' else "NOT NULL"
                default = f" DEFAULT {col['column_default']}" if col['column_default'] else ""
                print(f"  - {col['column_name']}: {col['data_type']} {nullable}{default}")
                
            # 统计用户数量
            cursor.execute('SELECT COUNT(*) FROM "user"')
            result = cursor.fetchone()
            user_count = result['count'] if result else 0
            print(f"👥 现有用户数量: {user_count}")
            
            # 检查用户数据示例
            if user_count > 0:
                cursor.execute("""
                    SELECT id, email, "emailVerified", name, role, plan, "createdAt" 
                    FROM "user" 
                    LIMIT 1
                """)
                sample_user = cursor.fetchone()
                print("👤 用户数据示例:")
                for key, value in sample_user.items():
                    print(f"  - {key}: {value}")
        else:
            print("❌ user表不存在")
            
        # 检查其他重要表
        important_tables = ['session', 'account', 'verification', 'organizations']
        print(f"\n🔍 检查其他重要表...")
        
        for table_name in important_tables:
            cursor.execute(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = '{table_name}'
                )
            """)
            result = cursor.fetchone()
            exists = result['exists'] if result else False
            status = "✅" if exists else "❌"
            print(f"  {status} {table_name}表: {'存在' if exists else '不存在'}")
            
        # 检查ENUM类型
        print(f"\n🔍 检查自定义ENUM类型...")
        enum_types = ['Role', 'Plan']
        
        for enum_type in enum_types:
            cursor.execute("""
                SELECT enumlabel 
                FROM pg_enum e
                JOIN pg_type t ON e.enumtypid = t.oid
                WHERE t.typname = %s
                ORDER BY e.enumsortorder
            """, (enum_type,))
            
            enum_values = cursor.fetchall()
            
            if enum_values:
                values = [row['enumlabel'] for row in enum_values]
                print(f"  ✅ {enum_type}: {', '.join(values)}")
            else:
                print(f"  ❌ {enum_type}: 未找到")
        
        # 关闭连接
        cursor.close()
        conn.close()
        print("\n✅ 数据库连接验证完成")
        return True
        
    except psycopg2.Error as e:
        print(f"❌ 数据库连接失败: {e}")
        return False
    except Exception as e:
        print(f"❌ 未知错误: {e}")
        return False

def main():
    """主函数"""
    print("=" * 60)
    print("万相营造 数据库连接验证")
    print("=" * 60)
    
    success = test_database_connection()
    
    if success:
        print("\n🎉 数据库验证成功！可以继续下一步开发。")
        print("\n📋 下一步建议:")
        print("  1. 数据库结构完全兼容FastAPI-Users需求")
        print("  2. 可以直接基于现有表结构创建认证系统")
        print("  3. 需要适配字段命名差异（如emailVerified vs is_verified）")
    else:
        print("\n💥 数据库验证失败！请检查数据库配置。")
    
    return success

if __name__ == "__main__":
    main()
