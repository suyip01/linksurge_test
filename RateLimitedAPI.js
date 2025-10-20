const http = require('http');

const LIMIT = 1;        // 每秒最大请求次数
const WINDOW_MS = 1000;  // 时间窗口（1秒）
const requests = new Map();

// 定期清理老的 IP 记录
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requests.entries()) {
        if (now - data.start >= WINDOW_MS) {
            requests.delete(ip);
        }
    }
}, 2000);

const server = http.createServer((req, res) => {
    const ip = req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let data = requests.get(ip);

    if (!data) {
        data = { count: 1, start: now };
        requests.set(ip, data);
    } else {
        if (now - data.start < WINDOW_MS) {
            data.count++;
        } else {
            data.count = 1;
            data.start = now;
        }
    }

    // 超出限制
    if (data.count > LIMIT) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Max ${LIMIT} requests per second.`
        }));
        return;
    }

    // ✅ API 路由定义
    if (req.method === 'GET' && req.url === '/api/data') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            endpoint: '/api/data',
            data: { time: new Date().toISOString() }
        }));
        return;
    }

    if (req.method === 'GET' && req.url === '/api/user') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            endpoint: '/api/user',
            data: { id: 1, name: 'Alice', age: 25 }
        }));
        return;
    }

    if (req.method === 'GET' && req.url === '/api/ping') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            endpoint: '/api/ping',
            message: 'pong'
        }));
        return;
    }

    // 未匹配到的路径
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(3000, () => {
    console.log('✅ API Server running at http://localhost:3000');
    console.log('Try the following endpoints:');
    console.log('  GET /api/data');
    console.log('  GET /api/user');
    console.log('  GET /api/ping');
});
