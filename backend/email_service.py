"""
邮件服务模块
用于发送验证邮件和密码重置邮件
"""

import smtplib
import secrets
import hashlib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import Optional
import os
from sqlalchemy.orm import Session
from models_adapted import User

class EmailService:
    def __init__(self):
        # QQ邮箱SMTP配置
        self.smtp_server = "smtp.qq.com"
        self.smtp_port = 587
        self.sender_email = "1592880030@qq.com"
        self.sender_password = "lzhjrlfxzewchjhe"  # 授权码
        
    def generate_verification_token(self, email: str) -> str:
        """生成邮箱验证token"""
        # 使用邮箱+时间戳+随机字符串生成token
        timestamp = str(int(datetime.utcnow().timestamp()))
        random_str = secrets.token_urlsafe(32)
        raw_token = f"{email}:{timestamp}:{random_str}"
        
        # 使用SHA256哈希
        token = hashlib.sha256(raw_token.encode()).hexdigest()
        return token
    
    def verify_token(self, token: str, email: str, max_age_hours: int = 24) -> bool:
        """验证token是否有效（简化版本，实际应该存储在数据库中）"""
        # 这里是简化实现，实际项目中应该将token存储在数据库中
        # 并在验证时检查token是否存在且未过期
        return len(token) == 64  # SHA256哈希长度
    
    def send_verification_email(self, to_email: str, verification_url: str) -> bool:
        """发送邮箱验证邮件"""
        try:
            # 创建邮件内容
            msg = MIMEMultipart('alternative')
            msg['Subject'] = "万相营造 - 邮箱验证"
            msg['From'] = self.sender_email
            msg['To'] = to_email
            
            # HTML邮件内容
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>邮箱验证</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🚀 万相营造</h1>
                        <p>欢迎加入我们的AI电商平台！</p>
                    </div>
                    <div class="content">
                        <h2>验证您的邮箱地址</h2>
                        <p>感谢您注册万相营造！为了确保您的账户安全，请点击下面的按钮验证您的邮箱地址：</p>
                        
                        <div style="text-align: center;">
                            <a href="{verification_url}" class="button">验证邮箱</a>
                        </div>
                        
                        <p>如果按钮无法点击，请复制以下链接到浏览器中打开：</p>
                        <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">
                            {verification_url}
                        </p>
                        
                        <p><strong>注意：</strong>此验证链接将在24小时后过期。</p>
                        
                        <p>如果您没有注册万相营造账户，请忽略此邮件。</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 万相营造 AI电商平台. 保留所有权利.</p>
                        <p>这是一封自动发送的邮件，请勿回复。</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # 纯文本版本
            text_content = f"""
            万相营造 - 邮箱验证
            
            欢迎加入我们的AI电商平台！
            
            感谢您注册万相营造！为了确保您的账户安全，请访问以下链接验证您的邮箱地址：
            
            {verification_url}
            
            注意：此验证链接将在24小时后过期。
            
            如果您没有注册万相营造账户，请忽略此邮件。
            
            © 2024 万相营造 AI电商平台
            """
            
            # 添加邮件内容
            text_part = MIMEText(text_content, 'plain', 'utf-8')
            html_part = MIMEText(html_content, 'html', 'utf-8')
            
            msg.attach(text_part)
            msg.attach(html_part)
            
            # 发送邮件
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.send_message(msg)
            
            print(f"✅ 验证邮件已发送到: {to_email}")
            return True
            
        except Exception as e:
            print(f"❌ 发送邮件失败: {str(e)}")
            return False
    
    def send_password_reset_email(self, to_email: str, reset_url: str) -> bool:
        """发送密码重置邮件"""
        try:
            # 创建邮件内容
            msg = MIMEMultipart('alternative')
            msg['Subject'] = "万相营造 - 密码重置"
            msg['From'] = self.sender_email
            msg['To'] = to_email
            
            # HTML邮件内容
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>密码重置</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 万相营造</h1>
                        <p>密码重置请求</p>
                    </div>
                    <div class="content">
                        <h2>重置您的密码</h2>
                        <p>我们收到了您的密码重置请求。点击下面的按钮来设置新密码：</p>
                        
                        <div style="text-align: center;">
                            <a href="{reset_url}" class="button">重置密码</a>
                        </div>
                        
                        <p>如果按钮无法点击，请复制以下链接到浏览器中打开：</p>
                        <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">
                            {reset_url}
                        </p>
                        
                        <p><strong>注意：</strong>此重置链接将在1小时后过期。</p>
                        
                        <p>如果您没有请求密码重置，请忽略此邮件，您的密码将保持不变。</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 万相营造 AI电商平台. 保留所有权利.</p>
                        <p>这是一封自动发送的邮件，请勿回复。</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # 纯文本版本
            text_content = f"""
            万相营造 - 密码重置
            
            我们收到了您的密码重置请求。请访问以下链接来设置新密码：
            
            {reset_url}
            
            注意：此重置链接将在1小时后过期。
            
            如果您没有请求密码重置，请忽略此邮件，您的密码将保持不变。
            
            © 2024 万相营造 AI电商平台
            """
            
            # 添加邮件内容
            text_part = MIMEText(text_content, 'plain', 'utf-8')
            html_part = MIMEText(html_content, 'html', 'utf-8')
            
            msg.attach(text_part)
            msg.attach(html_part)
            
            # 发送邮件
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.send_message(msg)
            
            print(f"✅ 密码重置邮件已发送到: {to_email}")
            return True
            
        except Exception as e:
            print(f"❌ 发送邮件失败: {str(e)}")
            return False

# 创建全局邮件服务实例
email_service = EmailService()