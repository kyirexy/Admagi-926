"""
FastAPI-Users 系统完整测试脚本
验证所有认证功能是否正常工作
"""

import asyncio
import aiohttp
import json
import time
from typing import Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

class FastAPIUsersSystemTester:
    """FastAPI-Users系统测试器"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session_token = None
        self.test_user_data = {
            "email": f"test_{int(time.time())}@example.com",
            "password": "testpass123",
            "name": "测试用户",
            "username": f"testuser_{int(time.time())}"
        }
        
    async def test_server_health(self) -> bool:
        """测试服务器健康状态"""
        print("🏥 测试服务器健康状态...")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/health") as response:
                    if response.status == 200:
                        data = await response.json()
                        print("✅ 服务器运行正常")
                        print(f"   版本: {data.get('version', 'N/A')}")
                        print(f"   认证系统: {data.get('auth_system', 'N/A')}")
                        return True
                    else:
                        print(f"❌ 服务器健康检查失败: {response.status}")
                        return False
        except Exception as e:
            print(f"❌ 无法连接到服务器: {e}")
            return False
    
    async def test_user_registration(self) -> bool:
        """测试用户注册"""
        print(f"\n👤 测试用户注册...")
        print(f"   邮箱: {self.test_user_data['email']}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/api/auth/register",
                    json=self.test_user_data,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    
                    data = await response.json()
                    
                    if response.status == 201:
                        print("✅ 用户注册成功")
                        print(f"   用户ID: {data.get('id', 'N/A')}")
                        print(f"   用户邮箱: {data.get('email', 'N/A')}")
                        print(f"   用户姓名: {data.get('name', 'N/A')}")
                        return True
                    else:
                        print(f"❌ 用户注册失败: {response.status}")
                        print(f"   错误信息: {data.get('detail', 'Unknown error')}")
                        return False
                        
        except Exception as e:
            print(f"❌ 注册请求异常: {e}")
            return False
    
    async def test_user_login(self) -> bool:
        """测试用户登录"""
        print(f"\n🔐 测试用户登录...")
        
        try:
            async with aiohttp.ClientSession() as session:
                # FastAPI-Users 使用 FormData 进行登录
                form_data = aiohttp.FormData()
                form_data.add_field('username', self.test_user_data['email'])
                form_data.add_field('password', self.test_user_data['password'])
                
                async with session.post(
                    f"{self.base_url}/api/auth/jwt/login",
                    data=form_data
                ) as response:
                    
                    data = await response.json()
                    
                    if response.status == 200:
                        self.session_token = data.get('access_token')
                        print("✅ 用户登录成功")
                        print(f"   Token类型: {data.get('token_type', 'N/A')}")
                        print(f"   Token前缀: {self.session_token[:20] if self.session_token else 'N/A'}...")
                        return True
                    else:
                        print(f"❌ 用户登录失败: {response.status}")
                        print(f"   错误信息: {data.get('detail', 'Unknown error')}")
                        return False
                        
        except Exception as e:
            print(f"❌ 登录请求异常: {e}")
            return False
    
    async def test_get_current_user(self) -> bool:
        """测试获取当前用户信息"""
        print(f"\n👤 测试获取用户信息...")
        
        if not self.session_token:
            print("❌ 没有有效的登录令牌")
            return False
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/api/users/me",
                    headers={"Authorization": f"Bearer {self.session_token}"}
                ) as response:
                    
                    data = await response.json()
                    
                    if response.status == 200:
                        print("✅ 获取用户信息成功")
                        print(f"   ID: {data.get('id', 'N/A')}")
                        print(f"   邮箱: {data.get('email', 'N/A')}")
                        print(f"   姓名: {data.get('name', 'N/A')}")
                        print(f"   积分: {data.get('credits', 'N/A')}")
                        print(f"   是否验证: {data.get('is_verified', 'N/A')}")
                        print(f"   用户角色: {data.get('role', 'N/A')}")
                        print(f"   用户计划: {data.get('plan', 'N/A')}")
                        return True
                    else:
                        print(f"❌ 获取用户信息失败: {response.status}")
                        print(f"   错误信息: {data.get('detail', 'Unknown error')}")
                        return False
                        
        except Exception as e:
            print(f"❌ 获取用户信息异常: {e}")
            return False
    
    async def test_better_auth_compatibility(self) -> bool:
        """测试Better Auth兼容性接口"""
        print(f"\n🔄 测试Better Auth兼容性...")
        
        if not self.session_token:
            print("❌ 没有有效的登录令牌")
            return False
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/api/auth/session",
                    headers={"Authorization": f"Bearer {self.session_token}"}
                ) as response:
                    
                    data = await response.json()
                    
                    if response.status == 200:
                        print("✅ Better Auth兼容接口正常")
                        
                        # 检查响应格式
                        if 'data' in data and 'error' in data:
                            print("✅ 响应格式符合Better Auth规范")
                            
                            session_data = data.get('data', {})
                            user_data = session_data.get('user')
                            session_info = session_data.get('session')
                            
                            if user_data:
                                print(f"   用户邮箱: {user_data.get('email', 'N/A')}")
                            
                            if session_info:
                                print(f"   会话状态: {session_info.get('active', 'N/A')}")
                                
                            return True
                        else:
                            print("⚠️  响应格式不符合Better Auth规范")
                            return False
                    else:
                        print(f"❌ Better Auth兼容接口失败: {response.status}")
                        return False
                        
        except Exception as e:
            print(f"❌ Better Auth兼容性测试异常: {e}")
            return False
    
    async def test_password_reset_flow(self) -> bool:
        """测试密码重置流程"""
        print(f"\n🔐 测试密码重置流程...")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/api/auth/forgot-password",
                    json={"email": self.test_user_data['email']},
                    headers={"Content-Type": "application/json"}
                ) as response:
                    
                    if response.status == 202:
                        print("✅ 密码重置邮件请求成功")
                        print("   (实际邮件发送取决于邮件配置)")
                        return True
                    else:
                        data = await response.json()
                        print(f"❌ 密码重置请求失败: {response.status}")
                        print(f"   错误信息: {data.get('detail', 'Unknown error')}")
                        return False
                        
        except Exception as e:
            print(f"❌ 密码重置请求异常: {e}")
            return False
    
    async def test_user_logout(self) -> bool:
        """测试用户登出"""
        print(f"\n🚪 测试用户登出...")
        
        if not self.session_token:
            print("❌ 没有有效的登录令牌")
            return False
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/api/auth/jwt/logout",
                    headers={"Authorization": f"Bearer {self.session_token}"}
                ) as response:
                    
                    if response.status == 200:
                        print("✅ 用户登出成功")
                        self.session_token = None
                        return True
                    else:
                        data = await response.json()
                        print(f"❌ 用户登出失败: {response.status}")
                        print(f"   错误信息: {data.get('detail', 'Unknown error')}")
                        return False
                        
        except Exception as e:
            print(f"❌ 登出请求异常: {e}")
            return False
    
    async def test_protected_endpoint(self) -> bool:
        """测试受保护的端点访问"""
        print(f"\n🔒 测试受保护端点访问...")
        
        if not self.session_token:
            print("❌ 没有有效的登录令牌，跳过测试")
            return True  # 这是预期行为
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/api/user/profile",
                    headers={"Authorization": f"Bearer {self.session_token}"}
                ) as response:
                    
                    if response.status == 200:
                        data = await response.json()
                        print("✅ 受保护端点访问成功")
                        print(f"   用户邮箱: {data.get('email', 'N/A')}")
                        return True
                    else:
                        data = await response.json()
                        print(f"❌ 受保护端点访问失败: {response.status}")
                        print(f"   错误信息: {data.get('detail', 'Unknown error')}")
                        return False
                        
        except Exception as e:
            print(f"❌ 受保护端点访问异常: {e}")
            return False
    
    async def run_comprehensive_test(self) -> Dict[str, bool]:
        """运行综合测试"""
        print("🚀 开始FastAPI-Users系统综合测试")
        print("=" * 50)
        
        test_results = {}
        
        # 测试服务器健康
        test_results['server_health'] = await self.test_server_health()
        if not test_results['server_health']:
            print("\n❌ 服务器不可用，停止测试")
            return test_results
        
        # 测试用户注册
        test_results['user_registration'] = await self.test_user_registration()
        
        # 测试用户登录
        test_results['user_login'] = await self.test_user_login()
        
        # 测试获取用户信息
        test_results['get_current_user'] = await self.test_get_current_user()
        
        # 测试Better Auth兼容性
        test_results['better_auth_compatibility'] = await self.test_better_auth_compatibility()
        
        # 测试受保护端点
        test_results['protected_endpoint'] = await self.test_protected_endpoint()
        
        # 测试密码重置
        test_results['password_reset'] = await self.test_password_reset_flow()
        
        # 测试用户登出
        test_results['user_logout'] = await self.test_user_logout()
        
        # 生成测试报告
        print("\n" + "=" * 50)
        print("📊 测试结果总结")
        print("=" * 50)
        
        passed = 0
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name.replace('_', ' ').title():<30} {status}")
            if result:
                passed += 1
        
        print(f"\n总计: {passed}/{total} 测试通过")
        
        if passed == total:
            print("🎉 所有测试通过！FastAPI-Users系统运行正常")
        else:
            print(f"⚠️  {total - passed} 个测试失败，请检查配置")
        
        return test_results

async def main():
    """主函数"""
    import sys
    
    base_url = "http://localhost:8000"
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    
    print(f"测试服务器: {base_url}")
    
    tester = FastAPIUsersSystemTester(base_url)
    results = await tester.run_comprehensive_test()
    
    # 退出码
    all_passed = all(results.values())
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    asyncio.run(main())
