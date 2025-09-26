/**
 * Better Auth 独立服务器
 * 提供完整的认证API服务
 */

import { handleAuthRequest } from "./src/routes/auth.js";
import { setCorsHeaders, handlePreflightRequest } from "./src/middleware/cors.js";
import { parseBody, sendJsonResponse, sendErrorResponse } from "./src/utils/request.js";
import { testConnection } from "./src/config/database.js";
import http from "http";
import url from "url";

// HTTP服务器
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url);
    const pathname = parsedUrl.pathname;
    
    // 设置CORS头
    setCorsHeaders(res);
    
    // 处理预检请求
    if (handlePreflightRequest(req, res)) {
        return;
    }
    
    console.log(`${new Date().toISOString()} ${req.method} ${pathname}`);
    
    // Better Auth API路由
    if (pathname.startsWith('/api/auth')) {
        await handleAuthRequest(req, res);
        return;
    }
    
    // 健康检查
    if (pathname === '/health') {
        sendJsonResponse(res, 200, { 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            service: 'AdMagic Backend'
        });
        return;
    }
    
    // 根路径
    if (pathname === '/') {
        sendJsonResponse(res, 200, {
            message: '万相营造 Better Auth 服务器',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            endpoints: [
                'POST /api/auth/sign-up - 用户注册',
                'POST /api/auth/sign-in - 用户登录',
                'POST /api/auth/sign-out - 用户登出',
                'GET /api/auth/session - 获取会话信息',
                'POST /api/auth/forgot-password - 忘记密码',
                'POST /api/auth/reset-password - 重置密码',
                'POST /api/auth/verify-email - 验证邮箱',
                'GET /health - 健康检查'
            ]
        });
        return;
    }
    
    // 404 处理
    sendErrorResponse(res, 404, '接口不存在');
});

// 启动服务器前测试数据库连接
async function startServer() {
    console.log('🚀 启动 AdMagic 后端服务器...');
    
    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
        console.error('❌ 数据库连接失败，服务器启动中止');
        process.exit(1);
    }
    
    const PORT = process.env.PORT || 8000;
    server.listen(PORT, () => {
        console.log(`✅ 服务器运行在 http://localhost:${PORT}`);
        console.log(`📚 API文档: http://localhost:${PORT}`);
        console.log(`🔍 健康检查: http://localhost:${PORT}/health`);
        console.log(`🔐 认证API: http://localhost:${PORT}/api/auth/*`);
    });
}

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信号，正在关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('收到 SIGINT 信号，正在关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});

// 启动服务器
startServer().catch(console.error);
