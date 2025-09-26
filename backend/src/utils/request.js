/**
 * 请求处理工具函数
 */

/**
 * 解析请求体
 * @param {Object} req - HTTP请求对象
 * @returns {Promise<Object>} - 解析后的请求体
 */
export async function parseBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch {
                resolve({});
            }
        });
    });
}

/**
 * 发送JSON响应
 * @param {Object} res - HTTP响应对象
 * @param {number} statusCode - 状态码
 * @param {Object} data - 响应数据
 */
export function sendJsonResponse(res, statusCode, data) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
}

/**
 * 发送错误响应
 * @param {Object} res - HTTP响应对象
 * @param {number} statusCode - 状态码
 * @param {string} message - 错误消息
 */
export function sendErrorResponse(res, statusCode, message) {
    sendJsonResponse(res, statusCode, {
        error: true,
        message: message
    });
}

export default { parseBody, sendJsonResponse, sendErrorResponse };