"""
快速启动 FastAPI 服务器
"""

import os
import sys
import subprocess

def main():
    print("🚀 启动万相营造 FastAPI 服务器...")
    
    # 检查是否在正确的目录
    if not os.path.exists("backend"):
        print("❌ 请在项目根目录下运行此脚本")
        return
    
    # 切换到backend目录
    os.chdir("backend")
    
    # 检查环境变量文件
    if not os.path.exists(".env"):
        if os.path.exists("env.example"):
            print("📋 复制环境变量配置文件...")
            import shutil
            shutil.copy("env.example", ".env")
            print("✅ 已创建 .env 文件，请根据需要修改配置")
        else:
            print("⚠️  未找到环境变量配置文件")
    
    # 检查依赖
    print("📦 检查Python依赖...")
    try:
        import fastapi
        import uvicorn
        import sqlalchemy
        print("✅ 依赖检查通过")
    except ImportError as e:
        print(f"❌ 缺少依赖: {e}")
        print("请运行: pip install -r requirements.txt")
        return
    
    # 启动服务器
    print("🌐 启动 FastAPI 服务器...")
    try:
        subprocess.run([
            sys.executable, 
            "main.py"
        ], check=True)
    except KeyboardInterrupt:
        print("\n👋 服务器已停止")
    except Exception as e:
        print(f"❌ 启动失败: {e}")

if __name__ == "__main__":
    main()
