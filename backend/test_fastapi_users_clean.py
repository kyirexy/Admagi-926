"""
纯FastAPI-Users系统功能测试脚本
验证清理后的标准实现是否正常工作
"""

import requests
import json
import time
from datetime import datetime

class FastAPIUsersSystemTester:
    """FastAPI-Users系统测试器"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session_token = None
        self.test_user_data = {
            "email": f"test_{int(time.time())}@example.com",
            "password": "testpass123456", 
            "name": "FastAPI测试用户"
        }
    
    def test_server_health(self) -> bool:
        """测试服务器健康状态"""
        print("🏥 测试服务器健康状态...")
        
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                print("✅ 服务器运行正常")
                print(f"   服务: {data.get('service', 'N/A')}")
                print(f"   版本: {data.get('version', 'N/A')}")
                print(f"   认证系统: {data.get('auth_system', 'N/A')}")
                print(f"   数据库: {data.get('database', 'N/A')}")
                return True
            else:
                print(f"❌ 健康检查失败: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ 服务器连接失败: {e}")
            return False
    
    def test_user_registration(self) -> bool:
        """测试用户注册"""
        print(f"\n👤 测试用户注册...")
        print(f"   邮箱: {self.test_user_data['email']}")
        
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/register",
                json=self.test_user_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ 用户注册成功")
                print(f"   用户ID: {data.get('id', 'N/A')}")
                print(f"   邮箱: {data.get('email', 'N/A')}")
                print(f"   姓名: {data.get('name', 'N/A')}")
                print(f"   活跃状态: {data.get('is_active', 'N/A')}")
                print(f"   验证状态: {data.get('is_verified', 'N/A')}")
                return True
            else:
                print(f"❌ 用户注册失败: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   错误信息: {error_data.get('detail', 'Unknown error')}")
                except:
                    print(f"   响应内容: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ 注册请求异常: {e}")
            return False
    
    def test_user_login(self) -> bool:
        """测试用户登录"""
        print(f"\n🔐 测试用户登录...")
        
        try:
            # FastAPI-Users标准登录格式 (Form data)
            form_data = {
                'username': self.test_user_data['email'],
                'password': self.test_user_data['password']
            }
            
            response = requests.post(
                f"{self.base_url}/api/auth/jwt/login",
                data=form_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.session_token = data.get('access_token')
                print("✅ 用户登录成功")
                print(f"   令牌类型: {data.get('token_type', 'N/A')}")
                print(f"   访问令牌: {self.session_token[:30] if self.session_token else 'N/A'}...")
                return True
            else:
                print(f"❌ 用户登录失败: {response.status_code}")
                try:
                    error_data = response.json() 
                    print(f"   错误信息: {error_data.get('detail', 'Unknown error')}")
                except:
                    print(f"   响应内容: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ 登录请求异常: {e}")
            return False
    
    def test_get_current_user(self) -> bool:
        """测试获取当前用户信息"""
        print(f"\n👤 测试获取用户信息...")
        
        if not self.session_token:
            print("❌ 没有有效的登录令牌")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            response = requests.get(
                f"{self.base_url}/api/users/me",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ 获取用户信息成功")
                print(f"   ID: {data.get('id', 'N/A')}")
                print(f"   邮箱: {data.get('email', 'N/A')}")
                print(f"   姓名: {data.get('name', 'N/A')}")
                print(f"   角色: {data.get('role', 'N/A')}")
                print(f"   计划: {data.get('plan', 'N/A')}")
                print(f"   活跃: {data.get('is_active', 'N/A')}")
                print(f"   验证: {data.get('is_verified', 'N/A')}")
                return True
            else:
                print(f"❌ 获取用户信息失败: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   错误信息: {error_data.get('detail', 'Unknown error')}")
                except:
                    print(f"   响应内容: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ 获取用户信息异常: {e}")
            return False
    
    def test_update_user_profile(self) -> bool:
        """测试更新用户信息"""
        print(f"\n📝 测试更新用户信息...")
        
        if not self.session_token:
            print("❌ 没有有效的登录令牌")
            return False
        
        try:
            update_data = {
                "name": "更新后的用户名",
                "image": "https://example.com/avatar.jpg"
            }
            
            headers = {"Authorization": f"Bearer {self.session_token}"}
            response = requests.patch(
                f"{self.base_url}/api/users/me",
                json=update_data,
                headers={**headers, "Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ 用户信息更新成功")
                print(f"   新姓名: {data.get('name', 'N/A')}")
                print(f"   新头像: {data.get('image', 'N/A')}")
                return True
            else:
                print(f"❌ 用户信息更新失败: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ 更新用户信息异常: {e}")
            return False
    
    def test_ai_service(self) -> bool:
        """测试AI服务"""
        print(f"\n🎨 测试AI生成服务...")
        
        if not self.session_token:
            print("❌ 没有有效的登录令牌")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            response = requests.post(
                f"{self.base_url}/api/ai/generate",
                params={
                    "prompt": "一只可爱的小猫",
                    "type": "image"
                },
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ AI服务调用成功")
                print(f"   任务ID: {data.get('task_id', 'N/A')}")
                print(f"   生成类型: {data.get('type', 'N/A')}")
                print(f"   预计时间: {data.get('estimated_time', 'N/A')}")
                return True
            else:
                print(f"❌ AI服务调用失败: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ AI服务调用异常: {e}")
            return False
    
    def test_user_logout(self) -> bool:
        """测试用户登出"""
        print(f"\n🚪 测试用户登出...")
        
        if not self.session_token:
            print("❌ 没有有效的登录令牌")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            response = requests.post(
                f"{self.base_url}/api/auth/jwt/logout",
                headers=headers
            )
            
            if response.status_code == 200:
                print("✅ 用户登出成功")
                self.session_token = None
                return True
            else:
                print(f"❌ 用户登出失败: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ 登出请求异常: {e}")
            return False
    
    def run_comprehensive_test(self) -> dict:
        """运行综合测试"""
        print("🚀 开始FastAPI-Users系统综合测试")
        print("=" * 60)
        
        test_results = {}
        
        # 测试服务器健康
        test_results['server_health'] = self.test_server_health()
        if not test_results['server_health']:
            print("\n❌ 服务器不可用，停止测试")
            return test_results
        
        # 测试用户注册
        test_results['user_registration'] = self.test_user_registration()
        
        # 测试用户登录
        test_results['user_login'] = self.test_user_login()
        
        # 测试获取用户信息
        test_results['get_current_user'] = self.test_get_current_user()
        
        # 测试更新用户信息
        test_results['update_user_profile'] = self.test_update_user_profile()
        
        # 测试AI服务
        test_results['ai_service'] = self.test_ai_service()
        
        # 测试用户登出
        test_results['user_logout'] = self.test_user_logout()
        
        # 生成测试报告
        print("\n" + "=" * 60)
        print("📊 FastAPI-Users测试结果总结")
        print("=" * 60)
        
        passed = 0
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            test_display = test_name.replace('_', ' ').title()
            print(f"{test_display:<25} {status}")
            if result:
                passed += 1
        
        success_rate = (passed / total) * 100 if total > 0 else 0
        print(f"\n📈 总计: {passed}/{total} 测试通过 ({success_rate:.1f}%)")
        
        if passed == total:
            print("🎉 所有测试通过！FastAPI-Users系统运行完美！")
        else:
            print(f"⚠️  {total - passed} 个测试失败，请检查配置")
        
        return test_results

def main():
    """主函数"""
    print("🎯 FastAPI-Users 系统测试工具")
    print("测试服务器: http://localhost:8000")
    print("开始时间:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    
    tester = FastAPIUsersSystemTester()
    results = tester.run_comprehensive_test()
    
    # 退出码
    all_passed = all(results.values()) if results else False
    if all_passed:
        print("\n🏆 恭喜！FastAPI-Users系统已成功部署并通过所有测试！")
    else:
        print("\n⚠️  部分测试失败，建议检查系统配置")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    exit(main())
