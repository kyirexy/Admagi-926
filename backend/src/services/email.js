/**
 * Better Auth 邮件发送服务
 * 符合官方文档规范的邮件发送配置
 */

import nodemailer from 'nodemailer';

// SMTP配置
const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 587,
    secure: false, // 使用STARTTLS
    auth: {
        user: process.env.SMTP_USER || '1592880030@qq.com',
        pass: process.env.SMTP_PASS || 'vktstvtssklyggeg'
    }
});

/**
 * 发送邮箱验证邮件
 * 符合Better Auth sendVerificationEmail规范
 */
export async function sendVerificationEmail({ user, url, token }, request) {
    console.log(`发送验证邮件给: ${user.email}`);
    console.log(`验证URL: ${url}`);
    console.log(`验证Token: ${token}`);
    
    const mailOptions = {
        from: {
            name: '万相营造 AI电商平台',
            address: process.env.SMTP_USER || '1592880030@qq.com'
        },
        to: user.email,
        subject: '验证您的万相营造账户邮箱',
        html: `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>验证您的邮箱</title>
            <style>
                body { font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
                .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                .content { padding: 40px 30px; line-height: 1.6; }
                .btn { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
                .verification-code { background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
                .code { font-size: 28px; font-weight: bold; color: #667eea; letter-spacing: 3px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🎨 万相营造</div>
                    <p>AI驱动的电商创作平台</p>
                </div>
                <div class="content">
                    <h2>验证您的邮箱地址</h2>
                    <p>亲爱的 <strong>${user.name || user.email}</strong>，</p>
                    <p>欢迎加入万相营造！为了确保账户安全，请点击下面的按钮完成邮箱验证：</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${url}" class="btn">立即验证邮箱</a>
                    </div>
                    
                    <div class="verification-code">
                        <p style="margin: 0; color: #666; font-size: 14px;">验证码：</p>
                        <div class="code">${token.substring(0, 6).toUpperCase()}</div>
                        <p style="margin-top: 10px; color: #666; font-size: 12px;">验证码有效期为1小时</p>
                    </div>
                    
                    <p style="margin-top: 30px; color: #666; font-size: 14px;">
                        如果按钮无法点击，请复制以下链接到浏览器中打开：<br>
                        <a href="${url}" style="color: #667eea; word-break: break-all;">${url}</a>
                    </p>
                    
                    <p style="margin-top: 20px; color: #666; font-size: 14px;">
                        如果您没有注册万相营造账户，请忽略此邮件。<br>
                        如有任何问题，请联系我们的客服团队。
                    </p>
                </div>
                <div class="footer">
                    <p>© 2025 万相营造 AI电商平台 | 让创意无界，让商业更智能</p>
                </div>
            </div>
        </body>
        </html>
        `,
        text: `
        万相营造 - 验证您的邮箱地址
        
        亲爱的 ${user.name || user.email}，
        
        欢迎加入万相营造！请点击以下链接验证您的邮箱：
        ${url}
        
        验证码：${token.substring(0, 6).toUpperCase()}
        
        如果您没有注册万相营造账户，请忽略此邮件。
        
        © 2025 万相营造 AI电商平台
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('验证邮件发送成功');
        return true;
    } catch (error) {
        console.error('发送验证邮件失败:', error);
        return false;
    }
}

/**
 * 发送密码重置邮件
 * 符合Better Auth sendResetPassword规范
 */
export async function sendResetPassword({ user, url, token }, request) {
    console.log(`发送密码重置邮件给: ${user.email}`);
    console.log(`重置URL: ${url}`);
    console.log(`重置Token: ${token}`);
    
    const mailOptions = {
        from: {
            name: '万相营造 AI电商平台',
            address: process.env.SMTP_USER || '1592880030@qq.com'
        },
        to: user.email,
        subject: '重置您的万相营造账户密码',
        html: `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>重置您的密码</title>
            <style>
                body { font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); color: white; padding: 30px 20px; text-align: center; }
                .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                .content { padding: 40px 30px; line-height: 1.6; }
                .warning-box { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0; }
                .btn { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🔒 万相营造</div>
                    <h1>密码重置请求</h1>
                </div>
                <div class="content">
                    <h2>重置您的密码</h2>
                    <p>亲爱的 <strong>${user.name || user.email}</strong>，</p>
                    <p>我们收到了您的密码重置请求。请点击下面的按钮来设置新密码：</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${url}" class="btn">重置密码</a>
                    </div>
                    
                    <div class="warning-box">
                        <p><strong>⚠️ 安全提醒：</strong></p>
                        <ul>
                            <li>此链接有效期为1小时</li>
                            <li>如果您没有请求重置密码，请忽略此邮件</li>
                            <li>为了账户安全，建议设置强密码</li>
                        </ul>
                    </div>
                    
                    <p style="margin-top: 30px; color: #666; font-size: 14px;">
                        如果按钮无法点击，请复制以下链接到浏览器中打开：<br>
                        <a href="${url}" style="color: #ff6b6b; word-break: break-all;">${url}</a>
                    </p>
                </div>
                <div class="footer">
                    <p>© 2025 万相营造 AI电商平台 | 让创意无界，让商业更智能</p>
                </div>
            </div>
        </body>
        </html>
        `,
        text: `
        万相营造 - 重置您的密码
        
        亲爱的 ${user.name || user.email}，
        
        我们收到了您的密码重置请求。请点击以下链接重置您的密码：
        ${url}
        
        此链接有效期为1小时。
        如果您没有请求重置密码，请忽略此邮件。
        
        © 2025 万相营造 AI电商平台
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('密码重置邮件发送成功');
        return true;
    } catch (error) {
        console.error('发送密码重置邮件失败:', error);
        return false;
    }
}

/**
 * 发送欢迎邮件 (可选)
 */
export async function sendWelcomeEmail(user) {
    const mailOptions = {
        from: {
            name: '万相营造 AI电商平台',
            address: process.env.SMTP_USER || '1592880030@qq.com'
        },
        to: user.email,
        subject: '欢迎加入万相营造 - 开启您的AI创作之旅！',
        html: `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>欢迎加入万相营造</title>
            <style>
                body { font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
                .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                .content { padding: 40px 30px; line-height: 1.6; }
                .feature-box { background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
                .btn { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🎨 万相营造</div>
                    <h1>欢迎加入我们！</h1>
                </div>
                <div class="content">
                    <h2>亲爱的 ${user.name || user.email}，</h2>
                    <p>恭喜您成功注册万相营造账户！我们很高兴为您开启AI创作之旅。</p>
                    
                    <div class="feature-box">
                        <h3>🎯 您现在可以享受：</h3>
                        <ul>
                            <li>🖼️ AI图片生成 - 创造独特的视觉内容</li>
                            <li>📝 AI文案创作 - 智能营销文案生成</li>
                            <li>🎨 设计模板 - 海量精美模板任您选择</li>
                            <li>📚 教程资源 - 从入门到精通的完整指南</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="http://localhost:3000" class="btn">开始创作之旅</a>
                    </div>
                    
                    <p style="margin-top: 30px; color: #666; font-size: 14px;">
                        如有任何问题或需要帮助，请随时联系我们的客服团队。
                    </p>
                </div>
                <div class="footer">
                    <p>© 2025 万相营造 AI电商平台 | 让创意无界，让商业更智能</p>
                </div>
            </div>
        </body>
        </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('欢迎邮件发送成功');
        return true;
    } catch (error) {
        console.error('发送欢迎邮件失败:', error);
        return false;
    }
}
