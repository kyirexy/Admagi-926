/**
 * 认证相关路由
 */

import { auth } from "../config/auth.js";

/**
 * 处理认证相关的HTTP请求
 * @param {Object} req - HTTP请求对象
 * @param {Object} res - HTTP响应对象
 */
export async function handleAuthRequest(req, res) {
    try {
        console.log('=== Better Auth 请求详情 ===');
        console.log('方法:', req.method);
        console.log('URL:', req.url);
        console.log('请求头:', JSON.stringify(req.headers, null, 2));
        
        // 解析请求体
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        await new Promise(resolve => {
            req.on('end', resolve);
        });
        
        console.log('原始请求体:', body);
        console.log('请求体类型:', typeof body);
        console.log('请求体长度:', body.length);
        console.log('请求体字符编码检查:', [...body].map(c => `${c}(${c.charCodeAt(0)})`).join(' '));
        
        // 尝试解析JSON
        let parsedBody = {};
        try {
            parsedBody = body ? JSON.parse(body) : {};
            console.log('解析后的请求体:', JSON.stringify(parsedBody, null, 2));
            if (parsedBody.email) {
                console.log('邮箱字段:', parsedBody.email);
                console.log('邮箱类型:', typeof parsedBody.email);
                console.log('邮箱长度:', parsedBody.email.length);
                console.log('邮箱字符编码:', [...parsedBody.email].map(c => `${c}(${c.charCodeAt(0)})`).join(' '));
                
                // 测试邮箱格式
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                console.log('邮箱格式验证:', emailRegex.test(parsedBody.email));
            }
        } catch (parseError) {
            console.log('JSON解析错误:', parseError.message);
        }
        
        // 构建Request对象
        const request = new Request(`http://localhost:8000${req.url}`, {
            method: req.method,
            headers: req.headers,
            body: body || undefined
        });
        
        console.log('构建的Request对象URL:', request.url);
        console.log('构建的Request对象方法:', request.method);
        
        // 调用Better Auth处理器
        const response = await auth.handler(request);
        
        console.log('Better Auth响应状态:', response.status);
        console.log('Better Auth响应头:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('Better Auth响应体:', responseText);
        
        // 设置响应头
        response.headers.forEach((value, key) => {
            res.setHeader(key, value);
        });
        
        // 设置状态码和响应体
        res.statusCode = response.status;
        res.end(responseText);
        
        console.log('=== Better Auth 请求结束 ===');
        
    } catch (error) {
        console.error('Better Auth 处理错误:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ 
            error: true, 
            message: '认证服务内部错误',
            details: error.message 
        }));
    }
}

export default { handleAuthRequest };