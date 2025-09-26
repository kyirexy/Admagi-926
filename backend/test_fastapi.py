"""
测试FastAPI后端服务
"""

import requests
import json
from datetime import datetime

# 服务器地址
BASE_URL = "http://localhost:8000"

def test_root_endpoint():
    """测试根路径"""
    print("=== 测试根路径 ===")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False

def test_health_check():
    """测试健康检查"""
    print("\n=== 测试健康检查 ===")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False

def test_signup():
    """测试用户注册"""
    print("\n=== 测试用户注册 ===")
    try:
        user_data = {
            "email": f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com",
            "password": "password123",
            "name": "测试用户"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/auth/sign-up",
            json=user_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"请求数据: {json.dumps(user_data, indent=2, ensure_ascii=False)}")
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
            return True
        else:
            print(f"错误响应: {response.text}")
            return False
    except Exception as e:
        print(f"错误: {e}")
        return False

def test_signin():
    """测试用户登录"""
    print("\n=== 测试用户登录 ===")
    try:
        # 先注册一个用户
        signup_data = {
            "email": f"login_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com",
            "password": "password123",
            "name": "登录测试用户"
        }
        
        signup_response = requests.post(
            f"{BASE_URL}/api/auth/sign-up",
            json=signup_data,
            headers={"Content-Type": "application/json"}
        )
        
        if signup_response.status_code != 200:
            print(f"注册失败: {signup_response.text}")
            return False
        
        # 然后尝试登录
        login_data = {
            "email": signup_data["email"],
            "password": signup_data["password"]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/auth/sign-in",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"请求数据: {json.dumps(login_data, indent=2, ensure_ascii=False)}")
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
            return True
        else:
            print(f"错误响应: {response.text}")
            return False
    except Exception as e:
        print(f"错误: {e}")
        return False

def test_api_docs():
    """测试API文档"""
    print("\n=== 测试API文档 ===")
    try:
        response = requests.get(f"{BASE_URL}/docs")
        print(f"状态码: {response.status_code}")
        print(f"API文档可访问: {response.status_code == 200}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False

def main():
    """运行所有测试"""
    print("FastAPI 后端服务测试")
    print("=" * 50)
    
    tests = [
        ("根路径", test_root_endpoint),
        ("健康检查", test_health_check),
        ("用户注册", test_signup),
        ("用户登录", test_signin),
        ("API文档", test_api_docs)
    ]
    
    results = []
    for test_name, test_func in tests:
        success = test_func()
        results.append((test_name, success))
    
    print("\n" + "=" * 50)
    print("测试结果汇总:")
    for test_name, success in results:
        status = "✅ 通过" if success else "❌ 失败"
        print(f"{test_name}: {status}")
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    print(f"\n总计: {passed}/{total} 个测试通过")

if __name__ == "__main__":
    main()