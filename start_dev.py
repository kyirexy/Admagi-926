#!/usr/bin/env python3
"""
AdMagic 本地开发环境启动脚本
"""

import os
import sys
import subprocess
import time
import threading
import socket
from pathlib import Path
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    import urllib.request
    import urllib.error
    HAS_REQUESTS = False

def print_banner():
    """打印启动横幅"""
    print("=" * 80)
    print("🚀 AdMagic 本地开发环境启动器")
    print("=" * 80)

def check_requirements():
    """检查基本要求"""
    print("🔍 检查开发环境...")
    
    # 检查 Python
    python_version = sys.version_info
    if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
        print("❌ Python 版本需要 3.8 或更高")
        return False
    print(f"✅ Python {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    # 检查 Node.js
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Node.js {result.stdout.strip()}")
        else:
            print("❌ Node.js 未安装")
            return False
    except FileNotFoundError:
        print("❌ Node.js 未安装")
        return False
    
    # 检查 npm
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ npm {result.stdout.strip()}")
        else:
            print("⚠️  npm 未安装，但可以继续")
    except FileNotFoundError:
        print("⚠️  npm 未安装，但可以继续")
    
    return True

def is_port_in_use(port):
    """检查端口是否被占用"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def check_service_health(url, service_name, timeout=10):
    """检查服务是否健康运行"""
    for i in range(timeout):
        try:
            if HAS_REQUESTS:
                response = requests.get(url, timeout=2)
                if response.status_code == 200:
                    print(f"✅ {service_name} 启动成功")
                    return True
            else:
                # 使用urllib作为fallback
                req = urllib.request.Request(url)
                with urllib.request.urlopen(req, timeout=2) as response:
                    if response.getcode() == 200:
                        print(f"✅ {service_name} 启动成功")
                        return True
        except Exception:
            pass
        time.sleep(1)
        if i == timeout - 1:
            print(f"❌ {service_name} 启动超时")
    return False

def start_backend():
    """启动后端服务"""
    print("\n🔧 启动后端服务...")
    backend_path = Path(__file__).parent / "backend"
    
    # 检查 Node.js 后端是否存在
    server_js = backend_path / "server.js"
    package_json = backend_path / "package.json"
    
    if not backend_path.exists():
        print("❌ 后端目录不存在")
        return False
        
    if not server_js.exists() or not package_json.exists():
        print("❌ 后端服务文件不存在 (server.js 或 package.json)")
        return False
    
    # 检查后端依赖是否安装
    node_modules = backend_path / "node_modules"
    if not node_modules.exists():
        print("⚠️  后端依赖未安装，正在安装...")
        os.chdir(backend_path)
        try:
            result = subprocess.run(['npm', 'install'], capture_output=True, text=True)
            if result.returncode != 0:
                print(f"❌ 安装后端依赖失败: {result.stderr}")
                return False
            print("✅ 后端依赖安装成功")
        except FileNotFoundError:
            print("❌ npm 未找到，无法安装后端依赖")
            return False
    
    # 检查端口是否被占用
    if is_port_in_use(8000):
        print("⚠️  端口 8000 已被占用，尝试连接现有服务...")
        if check_service_health("http://localhost:8000/health", "现有后端服务", timeout=3):
            return True
        else:
            print("❌ 端口 8000 被占用但服务不可用，请手动关闭占用进程")
            return False
    
    print("📍 启动 Better Auth 后端服务")
    os.chdir(backend_path)
    
    try:
        # 启动 Node.js 后端服务器
        print("⏳ 正在启动后端服务...")
        subprocess.Popen(['npm', 'start'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # 检查服务器是否成功启动
        return check_service_health("http://localhost:8000/health", "后端服务", timeout=15)
    except FileNotFoundError:
        print("❌ npm 未找到，无法启动后端服务")
        return False

def start_frontend():
    """启动前端服务"""
    print("\n🎨 启动前端服务...")
    frontend_path = Path(__file__).parent / "frontend"
    
    if not frontend_path.exists():
        print("❌ 前端目录不存在")
        return False
    
    # 检查 node_modules 是否存在
    node_modules = frontend_path / "node_modules"
    if not node_modules.exists():
        print("⚠️  前端依赖未安装，正在安装...")
        os.chdir(frontend_path)
        try:
            result = subprocess.run(['npm', 'install'], capture_output=True, text=True)
            if result.returncode != 0:
                print(f"❌ 安装前端依赖失败: {result.stderr}")
                return False
            print("✅ 前端依赖安装成功")
        except FileNotFoundError:
            print("❌ npm 未找到，无法安装前端依赖")
            return False
    
    # 检查端口是否被占用
    if is_port_in_use(3000):
        print("⚠️  端口 3000 已被占用，尝试连接现有服务...")
        if check_service_health("http://localhost:3000", "现有前端服务", timeout=3):
            return True
        else:
            print("❌ 端口 3000 被占用但服务不可用，请手动关闭占用进程")
            return False
    
    print("📍 启动 Next.js 开发服务器")
    os.chdir(frontend_path)
    
    # 启动前端开发服务器
    try:
        print("⏳ 正在启动前端服务...")
        subprocess.Popen(['npm', 'run', 'dev'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # 检查前端是否成功启动 (Next.js需要更长时间启动)
        return check_service_health("http://localhost:3000", "前端服务", timeout=30)
    except FileNotFoundError:
        print("❌ npm 未找到，无法启动前端服务")
        return False

def main():
    """主函数"""
    print_banner()
    
    # 检查基本要求
    if not check_requirements():
        print("\n❌ 环境检查失败，请安装必要的依赖")
        sys.exit(1)
    
    print("\n" + "=" * 80)
    print("🚀 启动开发服务...")
    print("=" * 80)
    
    # 启动后端
    backend_success = start_backend()
    
    # 启动前端
    frontend_success = start_frontend()
    
    print("\n" + "=" * 80)
    print("📋 服务状态:")
    print("=" * 80)
    
    if backend_success:
        print("✅ 后端服务: http://localhost:8000")
    else:
        print("❌ 后端服务: 启动失败")
    
    if frontend_success:
        print("✅ 前端服务: http://localhost:3000")
    else:
        print("❌ 前端服务: 启动失败")
    
    print("\n" + "=" * 80)
    print("📖 使用说明:")
    print("=" * 80)
    print("• 前端应用: http://localhost:3000")
    print("• 后端 API: http://localhost:8000")
    print("• API 文档: http://localhost:8000/")
    print("• 健康检查: http://localhost:8000/health")
    print("\n• 按 Ctrl+C 停止所有服务")
    print("=" * 80)
    
    if backend_success or frontend_success:
        try:
            print("\n⏳ 服务运行中，按 Ctrl+C 停止...")
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 正在停止服务...")
    else:
        print("\n❌ 没有服务成功启动")
        sys.exit(1)

if __name__ == "__main__":
    main()