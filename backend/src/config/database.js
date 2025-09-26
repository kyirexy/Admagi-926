/**
 * 数据库配置
 */

import { Pool } from "pg";
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

// 数据库连接池
export const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "admagic",
    user: process.env.DB_USER || "postgres", 
    password: process.env.DB_PASSWORD || "123456",
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// 测试数据库连接
export async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('✅ 数据库连接成功');
        client.release();
        return true;
    } catch (err) {
        console.error('❌ 数据库连接失败:', err);
        return false;
    }
}

export default pool;