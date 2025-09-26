"""
测试完整的认证流程
包括注册、自动登录、邮件发送
"""

import requests
import json
import time

def test_auth_flow():
    base_url = "http://localhost:8000"
    
    print("🚀 开始测试完整认证流程...")
    
    # 测试数据
    test_user = {
        "email": f"test{int(time.time())}@example.com",
        "password": "testpass123",
        "name": "测试用户"
    }
    
    print(f"\n1️⃣ 测试用户注册...")
    print(f"邮箱: {test_user['email']}")
    
    # 注册用户
    response = requests.post(
        f"{base_url}/api/auth/sign-up",
        json=test_user,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"注册响应状态码: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ 注册成功!")
        print(f"用户ID: {data['user']['id']}")
        print(f"用户邮箱: {data['user']['email']}")
        print(f"用户姓名: {data['user']['name']}")
        print(f"获得访问令牌: {'access_token' in data}")
        
        # 保存访问令牌用于后续测试
        access_token = data.get('access_token')
        
        if access_token:
            print(f"\n2️⃣ 测试会话验证...")
            
            # 测试获取会话信息
            session_response = requests.get(
                f"{base_url}/api/auth/session",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
            )
            
            print(f"会话验证状态码: {session_response.status_code}")
            
            if session_response.status_code == 200:
                session_data = session_response.json()
                print("✅ 会话验证成功!")
                print(f"当前用户: {session_data['user']['name']}")
                print(f"会话状态: {'active' if session_data.get('session', {}).get('active') else 'inactive'}")
            else:
                print("❌ 会话验证失败")
                print(session_response.text)
        
        print(f"\n3️⃣ 测试登录功能...")
        
        # 测试登录
        login_response = requests.post(
            f"{base_url}/api/auth/sign-in",
            json={
                "email": test_user["email"],
                "password": test_user["password"]
            },
            headers={"Content-Type": "application/json"}
        )
        
        print(f"登录响应状态码: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_data = login_response.json()
            print("✅ 登录成功!")
            print(f"用户: {login_data['user']['name']}")
            print(f"新的访问令牌已获得")
        else:
            print("❌ 登录失败")
            print(login_response.text)
            
    else:
        print("❌ 注册失败")
        print(f"错误详情: {response.text}")
    
    print(f"\n4️⃣ 测试健康检查...")
    health_response = requests.get(f"{base_url}/health")
    if health_response.status_code == 200:
        health_data = health_response.json()
        print("✅ 服务器运行正常")
        print(f"服务: {health_data.get('service')}")
        print(f"数据库状态: {health_data.get('database')}")
    
    print("\n🎉 测试完成!")

if __name__ == "__main__":
    try:
        test_auth_flow()
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到服务器，请确保FastAPI服务器正在运行")
        print("启动命令: python main.py")
    except Exception as e:
        print(f"❌ 测试过程中出现错误: {str(e)}")
