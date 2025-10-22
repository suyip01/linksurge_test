const { RateLimiterMemory } = require('rate-limiter-flexible');
const axios = require('axios'); // 假设你用axios调用API，如果不是请忽略

// 针对不同的 API 域名分别创建限速器，每秒最大20次
const apiLimiters = {};

// 获取针对特定API域名的限速器
function getApiLimiter(domain) {
  if (!apiLimiters[domain]) {
    apiLimiters[domain] = new RateLimiterMemory({
      points: 20, // 每秒允许20次请求
      duration: 1, // 1秒
    });
  }
  return apiLimiters[domain];
}

// 封装一个限速调用的方法
async function callApiWithRateLimit(domain, url) {
  const limiter = getApiLimiter(domain);
  try {
    await limiter.consume(domain); // 用域名作为唯一标识符
    // 限速检查通过，调用实际API请求函数
    return await fakeApiCall(url); // 将url动态传入
  } catch (rejRes) {
    // 如果超出限速，返回自定义错误
    throw new Error(`Rate limit exceeded for ${domain}. Please try again later.`);
  }
}

// 真实的 API 调用（假设为 GET 请求）
const fakeApiCall = (url) => {
  return axios.get(url)  // 使用动态传入的 URL
    .then(response => response.data)
    .catch(error => { throw new Error('API request failed') });
};

// 测试代码示例
async function testRateLimiter() {
  const domain = 'v1/tiktok/search/keyword';

  // 你可以动态传递不同的 URL
  const url1 = 'https://app.scrapecreators.com/';
  let successCount = 0;
  let failCount = 0;

  // 并发请求 30 次，超出 20 次限制
  const tasks = Array.from({ length: 30 }).map(async (_, idx) => {
    const url = idx % 2 === 0 ? url1 : url2; // 动态选择不同的 URL
    try {
      const result = await callApiWithRateLimit(domain, url);
      console.log(`Request #${idx + 1}:`, result);
      successCount++;
    } catch (e) {
      console.log(`Request #${idx + 1}:`, e.message);
      failCount++;
    }
  });

  await Promise.all(tasks);
  console.log(`成功请求次数: ${successCount}, 被限速拦截次数: ${failCount}`);
}

// 运行测试
testRateLimiter();
