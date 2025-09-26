"""
FastAPI-Users 服务器启动脚本
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def check_python_version():
    """检查Python版本"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ 是必需的")
        print(f"   当前版本: {sys.version}")
        return False
    
    print(f"✅ Python版本检查通过: {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")
    return True

def check_and_install_dependencies():
    """检查并安装依赖"""
    print("📦 检查依赖包...")
    
    requirements_file = "backend/requirements-fastapi-users.txt"
    if not Path(requirements_file).exists():
        print(f"❌ 依赖文件不存在: {requirements_file}")
        return False
    
    try:
        print("正在安装依赖包...")
        subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", requirements_file
        ], check=True, capture_output=True)
        print("✅ 依赖包安装完成")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ 依赖安装失败: {e}")
        return False

def setup_environment():
    """设置环境变量"""
    print("⚙️  设置环境变量...")
    
    env_example = Path("backend/.env.fastapi-users")
    env_file = Path("backend/.env")
    
    if not env_file.exists() and env_example.exists():
        shutil.copy(env_example, env_file)
        print("✅ 已创建环境配置文件 (.env)")
        print("⚠️  请根据需要修改 backend/.env 中的配置")
    elif env_file.exists():
        print("✅ 环境配置文件已存在")
    else:
        print("❌ 环境配置文件不存在")
        return False
    
    return True

def check_database_connection():
    """检查数据库连接"""
    print("🗄️  检查数据库连接...")
    
    try:
        os.chdir("backend")
        result = subprocess.run([
            sys.executable, "-c", 
            "import asyncio; "
            "from models import engine; "
            "async def test(): "
            "    async with engine.begin() as conn: "
            "        await conn.execute('SELECT 1'); "
            "asyncio.run(test()); "
            "print('数据库连接成功')"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ 数据库连接正常")
            return True
        else:
            print(f"❌ 数据库连接失败: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ 数据库检查异常: {e}")
        return False
    finally:
        os.chdir("..")

def run_migration_if_needed():
    """如果需要，运行数据库迁移"""
    print("🔄 检查是否需要数据库迁移...")
    
    choice = input("是否需要运行数据库迁移？(y/N): ").strip().lower()
    if choice == 'y':
        try:
            os.chdir("backend")
            subprocess.run([
                sys.executable, "migrate_to_fastapi_users.py"
            ], check=True)
            print("✅ 数据库迁移完成")
        except subprocess.CalledProcessError:
            print("❌ 数据库迁移失败")
            return False
        finally:
            os.chdir("..")
    
    return True

def start_server():
    """启动FastAPI服务器"""
    print("🚀 启动FastAPI-Users服务器...")
    
    try:
        os.chdir("backend")
        
        # 使用uvicorn启动服务器
        port = os.getenv("PORT", "8000")
        
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "main_fastapi_users:app",
            "--host", "0.0.0.0",
            "--port", str(port),
            "--reload",
            "--log-level", "info"
        ], check=True)
        
    except KeyboardInterrupt:
        print("\n👋 服务器已停止")
    except subprocess.CalledProcessError as e:
        print(f"❌ 服务器启动失败: {e}")
    finally:
        os.chdir("..")

def main():
    """主函数"""
    print("🎯 万相营造 FastAPI-Users 服务器启动器")
    print("=" * 50)
    
    # 检查Python版本
    if not check_python_version():
        return
    
    # 检查并安装依赖
    if not check_and_install_dependencies():
        return
    
    # 设置环境变量
    if not setup_environment():
        return
    
    # 检查数据库连接
    if not check_database_connection():
        print("⚠️  数据库连接失败，但仍可以启动服务器")
        choice = input("是否继续启动？(y/N): ").strip().lower()
        if choice != 'y':
            return
    
    # 运行迁移
    if not run_migration_if_needed():
        return
    
    # 启动服务器
    print("\n🌐 准备启动服务器...")
    print(f"📍 服务地址: http://localhost:{os.getenv('PORT', '8000')}")
    print(f"📚 API文档: http://localhost:{os.getenv('PORT', '8000')}/docs")
    print("\n按 Ctrl+C 停止服务器")
    
    input("按回车键开始启动服务器...")
    
    start_server()

if __name__ == "__main__":
    main()
