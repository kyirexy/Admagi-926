#!/usr/bin/env python3
"""
添加password_hash字段到现有用户表的脚本
"""

import os
import psycopg2
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

def add_password_column():
    """添加password_hash字段到用户表"""
    try:
        # 从环境变量获取数据库连接信息
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            print("错误: 未找到DATABASE_URL环境变量")
            return False
            
        # 连接数据库
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        # 添加password_hash字段
        alter_sql = """
        ALTER TABLE "user" 
        ADD COLUMN IF NOT EXISTS password_hash TEXT;
        """
        
        cursor.execute(alter_sql)
        conn.commit()
        
        print("✅ 成功添加password_hash字段到用户表")
        
        # 验证字段是否添加成功
        cursor.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user' AND column_name = 'password_hash';
        """)
        
        result = cursor.fetchone()
        if result:
            print(f"✅ 验证成功: {result[0]} ({result[1]})")
        else:
            print("❌ 验证失败: 未找到password_hash字段")
            
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ 添加字段失败: {e}")
        return False

if __name__ == "__main__":
    print("开始添加password_hash字段...")
    success = add_password_column()
    if success:
        print("操作完成!")
    else:
        print("操作失败!")