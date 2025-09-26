import http from 'http';

// 生成随机邮箱地址
const randomEmail = `test${Date.now()}@example.com`;

const postData = JSON.stringify({
    email: randomEmail,
    password: "password123",
    name: "Test User"
});

const options = {
    hostname: 'localhost',
    port: 8000,
    path: '/api/auth/sign-up/email',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Node.js Test Client'
    }
};

console.log('测试新用户注册...');
console.log('使用邮箱:', randomEmail);

const req = http.request(options, (res) => {
    console.log('状态码:', res.statusCode);
    console.log('响应头:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('响应体:', data);
        try {
            const parsed = JSON.parse(data);
            console.log('解析后的响应:', JSON.stringify(parsed, null, 2));
            
            if (res.statusCode === 200 || res.statusCode === 201) {
                console.log('✅ 用户注册成功！');
            } else {
                console.log('❌ 用户注册失败');
            }
        } catch (e) {
            console.log('无法解析响应为JSON:', e.message);
        }
    });
});

req.on('error', (e) => {
    console.error('请求错误:', e.message);
});

req.write(postData);
req.end();