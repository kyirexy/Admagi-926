/**
 * 检查数据库中account表的实际结构
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'admagic',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123456',
});

async function checkAccountTable() {
    try {
        console.log('检查account表结构...');
        
        // 检查表是否存在
        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'account'
            );
        `);
        
        console.log('account表是否存在:', tableExists.rows[0].exists);
        
        if (tableExists.rows[0].exists) {
            // 获取表结构
            const columns = await pool.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'account'
                ORDER BY ordinal_position;
            `);
            
            console.log('\naccount表的列结构:');
            columns.rows.forEach(col => {
                console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
            });
            
            // 检查约束
            const constraints = await pool.query(`
                SELECT 
                    tc.constraint_name,
                    tc.constraint_type,
                    kcu.column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu 
                    ON tc.constraint_name = kcu.constraint_name
                WHERE tc.table_name = 'account';
            `);
            
            console.log('\naccount表的约束:');
            constraints.rows.forEach(constraint => {
                console.log(`- ${constraint.constraint_name}: ${constraint.constraint_type} on ${constraint.column_name}`);
            });
        }
        
        // 检查user表结构作为对比
        console.log('\n检查user表结构...');
        const userColumns = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'user'
            ORDER BY ordinal_position;
        `);
        
        console.log('\nuser表的列结构:');
        userColumns.rows.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
        });
        
    } catch (error) {
        console.error('检查数据库结构失败:', error);
    } finally {
        await pool.end();
    }
}

checkAccountTable();