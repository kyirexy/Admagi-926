/**
 * 简单的邮箱格式验证测试
 */

// 测试不同的邮箱格式
const testEmails = [
    'test@example.com',
    'debug@example.com',
    'user@test.com',
    'simple@gmail.com',
    'a@b.co',
    'test.email@domain.org'
];

// 简单的邮箱验证正则表达式
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

console.log('邮箱格式验证测试:');
testEmails.forEach(email => {
    const isValid = emailRegex.test(email);
    console.log(`${email}: ${isValid ? '✓ 有效' : '✗ 无效'}`);
});

// 测试我们使用的邮箱
const ourEmail = 'debug@example.com';
console.log(`\n我们使用的邮箱 "${ourEmail}" 是否有效: ${emailRegex.test(ourEmail) ? '✓ 是' : '✗ 否'}`);

// 检查邮箱是否包含特殊字符
console.log('\n邮箱字符分析:');
console.log('邮箱:', ourEmail);
console.log('长度:', ourEmail.length);
console.log('字符编码:', [...ourEmail].map(c => `${c}(${c.charCodeAt(0)})`).join(' '));
console.log('是否包含空格:', ourEmail.includes(' '));
console.log('是否包含制表符:', ourEmail.includes('\t'));
console.log('是否包含换行符:', ourEmail.includes('\n'));