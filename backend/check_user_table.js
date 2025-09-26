import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'admagic',
  user: 'postgres',
  password: '123456'
});

async function checkUserTable() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user' 
      ORDER BY ordinal_position;
    `);
    
    console.log('用户表结构:');
    console.table(result.rows);
    
    // 检查是否有数据
    const countResult = await pool.query('SELECT COUNT(*) FROM "user"');
    console.log('用户表记录数:', countResult.rows[0].count);
    
    // 检查其他Better Auth相关表
    const tables = ['session', 'account', 'verification'];
    for (const table of tables) {
      try {
        const tableResult = await pool.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position;
        `, [table]);
        
        console.log(`\n${table}表结构:`);
        console.table(tableResult.rows);
      } catch (err) {
        console.log(`${table}表不存在或查询失败:`, err.message);
      }
    }
    
  } catch (error) {
    console.error('数据库查询错误:', error.message);
  } finally {
    await pool.end();
  }
}

checkUserTable();