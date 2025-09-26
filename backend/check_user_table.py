#!/usr/bin/env python3
"""
检查用户表的实际结构
"""

import os
import psycopg2
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

def check_user_table():
    """检查用户表结构"""
    try:
        # 从环境变量获取数据库连接信息
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            print("错误: 未找到DATABASE_URL环境变量")
            return False
            
        # 连接数据库
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        # 查询用户表结构
        cursor.execute("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'user' 
        ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        
        print("用户表结构:")
        print("-" * 60)
        for col in columns:
            print(f"{col[0]:<20} {col[1]:<15} {col[2]:<10} {col[3] or ''}")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ 检查失败: {e}")
        return False

if __name__ == "__main__":
    check_user_table()