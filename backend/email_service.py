"""
异步邮件服务模块
支持FastAPI-Users的异步邮件发送功能
"""

import aiosmtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
from jinja2 import Environment, DictLoader
from dotenv import load_dotenv
import asyncio

load_dotenv()

# 邮件模板
EMAIL_TEMPLATES = {
    # 欢迎邮件模板
    "welcome": """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>欢迎加入万相营造</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; padding: 10px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; font-size: 24px; font-weight: bold;">
                    万相营造
                </div>
            </div>
            
            <h2 style="color: #333; text-align: center;">欢迎加入我们！</h2>
            
            <p>亲爱的 {{ user_name }}，</p>
            
            <p>感谢您注册万相营造 AI电商平台！我们很高兴您选择了我们的服务。</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #495057;">您可以使用我们的以下功能：</h3>
                <ul style="color: #6c757d;">
                    <li>🎨 AI图片生成服务</li>
                    <li>📝 智能文案创作</li>
                    <li>🎬 视频内容生成</li>
                    <li>🛍️ 电商素材制作</li>
                    <li>💡 创意灵感工具</li>
                </ul>
            </div>
            
            <p style="text-align: center; margin: 30px 0;">
                <a href="{{ app_url }}" style="display: inline-block; padding: 12px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    立即开始使用
                </a>
            </p>
            
            <p>如果您有任何问题或需要帮助，请随时联系我们的客服团队。</p>
            
            <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px; text-align: center; color: #6c757d; font-size: 14px;">
                <p>此致，<br>万相营造团队</p>
                <p>邮箱: support@admagic.com</p>
            </div>
        </div>
    </body>
    </html>
    """,
    
    # 邮箱验证模板
    "verification": """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>验证您的邮箱地址</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; padding: 10px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; font-size: 24px; font-weight: bold;">
                    万相营造
                </div>
            </div>
            
            <h2 style="color: #333; text-align: center;">验证您的邮箱地址</h2>
            
            <p>亲爱的 {{ user_name }}，</p>
            
            <p>感谢您注册万相营造！请点击下方按钮验证您的邮箱地址：</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ verification_url }}" style="display: inline-block; padding: 15px 30px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    验证邮箱地址
                </a>
            </div>
            
            <p style="color: #6c757d; font-size: 14px;">
                如果按钮无法点击，请复制以下链接到浏览器地址栏：<br>
                <a href="{{ verification_url }}">{{ verification_url }}</a>
            </p>
            
            <p style="color: #6c757d; font-size: 14px;">
                该链接将在1小时后失效。如果您没有注册万相营造账户，请忽略此邮件。
            </p>
            
            <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px; text-align: center; color: #6c757d; font-size: 14px;">
                <p>此致，<br>万相营造团队</p>
            </div>
        </div>
    </body>
    </html>
    """,
    
    # 密码重置模板
    "password_reset": """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>重置您的密码</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; padding: 10px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; font-size: 24px; font-weight: bold;">
                    万相营造
                </div>
            </div>
            
            <h2 style="color: #333; text-align: center;">重置您的密码</h2>
            
            <p>亲爱的 {{ user_name }}，</p>
            
            <p>您请求重置万相营造账户的密码。请点击下方按钮设置新密码：</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ reset_url }}" style="display: inline-block; padding: 15px 30px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    重置密码
                </a>
            </div>
            
            <p style="color: #6c757d; font-size: 14px;">
                如果按钮无法点击，请复制以下链接到浏览器地址栏：<br>
                <a href="{{ reset_url }}">{{ reset_url }}</a>
            </p>
            
            <p style="color: #6c757d; font-size: 14px;">
                该链接将在1小时后失效。如果您没有请求重置密码，请忽略此邮件。
            </p>
            
            <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px; text-align: center; color: #6c757d; font-size: 14px;">
                <p>此致，<br>万相营造团队</p>
            </div>
        </div>
    </body>
    </html>
    """
}

class EmailService:
    """异步邮件服务类"""
    
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.qq.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.email_user = os.getenv("EMAIL_USER", "1592880030@qq.com") 
        self.email_password = os.getenv("EMAIL_PASSWORD", "")
        self.from_name = os.getenv("FROM_NAME", "万相营造")
        self.frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        
        # 初始化Jinja2模板环境
        self.template_env = Environment(loader=DictLoader(EMAIL_TEMPLATES))
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        异步发送邮件
        """
        try:
            # 创建邮件对象
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{self.from_name} <{self.email_user}>"
            message["To"] = to_email
            
            # 添加文本内容
            if text_content:
                text_part = MIMEText(text_content, "plain", "utf-8")
                message.attach(text_part)
            
            # 添加HTML内容
            html_part = MIMEText(html_content, "html", "utf-8")
            message.attach(html_part)
            
            # 异步发送邮件
            await aiosmtplib.send(
                message,
                hostname=self.smtp_server,
                port=self.smtp_port,
                start_tls=True,
                username=self.email_user,
                password=self.email_password,
            )
            
            print(f"✅ 邮件发送成功: {to_email}")
            return True
            
        except Exception as e:
            print(f"❌ 邮件发送失败: {str(e)}")
            return False
    
    async def send_welcome_email(
        self,
        to_email: str,
        user_name: str
    ) -> bool:
        """发送欢迎邮件"""
        template = self.template_env.get_template("welcome")
        html_content = template.render(
            user_name=user_name,
            app_url=self.frontend_url
        )
        
        return await self.send_email(
            to_email=to_email,
            subject="欢迎加入万相营造！",
            html_content=html_content
        )
    
    async def send_verification_email(
        self,
        to_email: str,
        user_name: str,
        verification_url: str,
        token: str
    ) -> bool:
        """发送邮箱验证邮件"""
        template = self.template_env.get_template("verification")
        html_content = template.render(
            user_name=user_name,
            verification_url=verification_url,
            token=token
        )
        
        return await self.send_email(
            to_email=to_email,
            subject="验证您的邮箱地址 - 万相营造",
            html_content=html_content
        )
    
    async def send_reset_password_email(
        self,
        to_email: str,
        user_name: str,
        reset_url: str,
        token: str
    ) -> bool:
        """发送密码重置邮件"""
        template = self.template_env.get_template("password_reset")
        html_content = template.render(
            user_name=user_name,
            reset_url=reset_url,
            token=token
        )
        
        return await self.send_email(
            to_email=to_email,
            subject="重置您的密码 - 万相营造",
            html_content=html_content
        )

# 单例模式的邮件服务实例
email_service = EmailService()