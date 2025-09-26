/**
 * 检查account表结构
 */

import { Pool } from "pg";

const pool = new Pool({
    host: "localhost",
    port: 5432,
    database: "admagic",
    user: "postgres", 
    password: "123456",
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

async function checkAccountTable() {
    try {
        console.log('检查account表结构...');
        
        // 查看account表结构
        const tableStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'account' AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        console.log('Account表字段:');
        tableStructure.rows.forEach(row => {
            console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
        });
        
        // 查看约束
        const constraints = await pool.query(`
            SELECT constraint_name, constraint_type, column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_name = 'account' AND tc.table_schema = 'public';
        `);
        
        console.log('\nAccount表约束:');
        constraints.rows.forEach(row => {
            console.log(`- ${row.constraint_name}: ${row.constraint_type} on ${row.column_name}`);
        });
        
        // 尝试查看一些示例数据
        const sampleData = await pool.query('SELECT * FROM account LIMIT 3');
        console.log('\nAccount表示例数据:');
        console.log(sampleData.rows);
        
    } catch (error) {
        console.error('检查account表失败:', error);
    } finally {
        await pool.end();
    }
}

checkAccountTable();