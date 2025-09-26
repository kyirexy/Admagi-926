import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'admagic',
  user: 'postgres',
  password: '123456'
});

async function checkTables() {
  try {
    // 检查所有表
    const tablesResult = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('数据库中的表:');
    tablesResult.rows.forEach(row => console.log('- ' + row.table_name));
    
    // 检查user表结构
    const userColumns = await pool.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'user' AND table_schema = 'public' ORDER BY ordinal_position");
    console.log('\nuser表结构:');
    userColumns.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // 检查account表是否存在
    const accountCheck = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'account')");
    console.log('\naccount表存在:', accountCheck.rows[0].exists);
    
    // 检查session表是否存在
    const sessionCheck = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'session')");
    console.log('session表存在:', sessionCheck.rows[0].exists);
    
    // 检查verification表是否存在
    const verificationCheck = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'verification')");
    console.log('verification表存在:', verificationCheck.rows[0].exists);
    
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();