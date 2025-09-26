/**
 * CORS 中间件
 */

/**
 * 设置CORS头
 * @param {Object} res - HTTP响应对象
 */
export function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
}

/**
 * 处理预检请求
 * @param {Object} req - HTTP请求对象
 * @param {Object} res - HTTP响应对象
 * @returns {boolean} - 是否为预检请求
 */
export function handlePreflightRequest(req, res) {
    if (req.method === 'OPTIONS') {
        setCorsHeaders(res);
        res.writeHead(200);
        res.end();
        return true;
    }
    return false;
}

export default { setCorsHeaders, handlePreflightRequest };