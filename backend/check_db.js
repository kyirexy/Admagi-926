import { Pool } from 'pg';

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'admagic',
    user: 'postgres',
    password: '123456'
});

async function checkDatabase() {
    try {
        // 检查user表结构
        const userTableQuery = `
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'user' 
            ORDER BY ordinal_position
        `;
        
        const userResult = await pool.query(userTableQuery);
        console.log('user表结构:');
        userResult.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
        // 检查account表结构
        const accountTableQuery = `
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'account' 
            ORDER BY ordinal_position
        `;
        
        const accountResult = await pool.query(accountTableQuery);
        console.log('\naccount表结构:');
        accountResult.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
        // 检查session表结构
        const sessionTableQuery = `
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'session' 
            ORDER BY ordinal_position
        `;
        
        const sessionResult = await pool.query(sessionTableQuery);
        console.log('\nsession表结构:');
        sessionResult.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
    } catch (error) {
        console.error('数据库检查错误:', error);
    } finally {
        await pool.end();
    }
}

checkDatabase();