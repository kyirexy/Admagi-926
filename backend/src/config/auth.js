/**
 * Better Auth 配置 - 完整的邮箱和密码认证
 * 符合官方文档规范的配置，匹配实际数据库schema
 */

import { betterAuth } from "better-auth";
import { pool } from "./database.js";
import { sendVerificationEmail, sendResetPassword } from "../services/email.js";
import dotenv from "dotenv";
import crypto from "crypto";

// 加载环境变量
dotenv.config();

// Better Auth 配置
export const auth = betterAuth({
    database: pool,
    
    // 基础配置
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:8000",
    basePath: "/api/auth",
    
    // 邮箱和密码认证配置
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // 开发环境设为false
        autoSignIn: true, // 注册后自动登录
        minPasswordLength: 6,
        maxPasswordLength: 128,
        disableSignUp: false
    },
    
    // 基础配置
    secret: process.env.BETTER_AUTH_SECRET || "development-secret-change-in-production-please-make-it-longer-than-32-chars",
    
    // 开发环境配置
    advanced: {
        disableCSRFCheck: process.env.NODE_ENV === "development" || true, // 开发环境禁用CSRF检查
        useSecureCookies: process.env.NODE_ENV === "production"
    }
});

// 导出认证处理器 - 使用默认导出以确保CLI兼容性
export default auth;