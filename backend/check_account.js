import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'admagic',
  user: 'postgres',
  password: '123456'
});

async function checkAccountTable() {
  try {
    const accountColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'account' AND table_schema = 'public' 
      ORDER BY ordinal_position
    `);
    
    console.log('account表结构:');
    accountColumns.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    const accountCount = await pool.query('SELECT COUNT(*) FROM account');
    console.log('\naccount表记录数:', accountCount.rows[0].count);
    
    const userCount = await pool.query('SELECT COUNT(*) FROM "user"');
    console.log('user表记录数:', userCount.rows[0].count);
    
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await pool.end();
  }
}

checkAccountTable();