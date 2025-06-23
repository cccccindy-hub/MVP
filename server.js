require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const RankingService = require('./services/rankingService');
const SchedulerService = require('./services/schedulerService');
const rankingsRouter = require('./api/rankings');
const fs = require('fs');

// 打印所有环境变量（隐藏敏感信息）
console.log('Environment variables loaded:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_NAME: process.env.DB_NAME,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '已设置' : '未设置'
});

const rankingService = new RankingService();
const schedulerService = new SchedulerService();
const app = express();
const PORT = process.env.PORT || 3001;

// 启用 CORS
app.use(cors());

// 启动定时任务
schedulerService.startScheduledTasks();

// 中间件
app.use(express.json());

// 请求日志中间件
app.use((req, res, next) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    console.log('=== 新请求开始 ===');
    console.log(`[${requestId}] 请求接收:`, {
        method: req.method,
        url: req.url,
        params: req.params,
        query: req.query,
        headers: {
            'user-agent': req.headers['user-agent'],
            'accept': req.headers['accept']
        },
        timestamp: new Date().toISOString()
    });

    // 添加响应完成的监听器
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`[${requestId}] 响应完成:`, {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
        });
        console.log('=== 请求结束 ===\n');
    });

    // 将requestId添加到请求对象中
    req.requestId = requestId;
    next();
});

// API路由
app.use('/api', rankingsRouter);

// API路由 - rankings
app.get('/api/rankings/:region/:serviceType/:year/:month', async (req, res) => {
    try {
        const { region, serviceType, year, month } = req.params;
        const rankings = await rankingService.getRankings(region, serviceType, year, month);
        res.json(rankings);
    } catch (error) {
        console.error('Error getting rankings:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Add generate endpoint
app.post('/api/rankings/generate', async (req, res) => {
    try {
        const { region, serviceType, year, month } = req.body;
        
        // Validate required parameters
        if (!region || !serviceType || !year || !month) {
            return res.status(400).json({ 
                error: 'Missing required parameters',
                details: 'Please provide region, serviceType, year, and month'
            });
        }

        // Generate rankings
        const rankings = await rankingService.generateRankings(
            region,
            serviceType,
            parseInt(year, 10),
            parseInt(month, 10)
        );

        res.json({
            message: 'Rankings generated successfully',
            data: rankings
        });
    } catch (error) {
        console.error('Error generating rankings:', error);
        res.status(500).json({ 
            error: 'Failed to generate rankings',
            details: error.message
        });
    }
});

// 添加手动触发更新的API端点
app.post('/api/rankings/update', async (req, res) => {
    const { requestId } = req;
    console.log(`[${requestId}] 收到手动更新排名请求`);
    
    try {
        await schedulerService.triggerManualUpdate();
        res.json({ message: '排名更新任务已触发' });
    } catch (error) {
        console.error(`[${requestId}] 手动更新失败:`, error);
        res.status(500).json({ 
            error: '更新失败',
            details: error.message
        });
    }
});

// 静态文件服务 - 在API路由之后
app.use(express.static(path.join(__dirname)));

// load-all 页面请求
app.get('/load-all', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'load-all.html'));
});

// sitemap 页面请求
app.get('/sitemap.xml', (req, res) => {
    res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

// robots 页面请求
app.get('/robots.txt', (req, res) => {
    res.sendFile(path.join(__dirname, 'robots.txt'));
});

// logo
app.get('/favicon.ico', (req, res) => {
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(path.join(__dirname, '/images/bizuccess-badge.png'));
});

// 处理服务页面请求
app.get('/:serviceType-services-provider-:region', (req, res) => {
    const { serviceType, region } = req.params;
    const formattedRegion = region.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    console.log(`Request for ${serviceType} services in ${formattedRegion}`);
    
    // Map serviceType to template name
    const templateMap = {
        'eor': 'eor',
        'payroll': 'payroll'
    };
    
    const templateName = templateMap[serviceType];
    if (!templateName) {
        return res.status(404).json({
            error: 'Service type not found',
            details: `The requested service type "${serviceType}" is not available`
        });
    }
    
    // 根据服务类型选择模板
    const templatePath = path.join(__dirname, 'templates', `${serviceType}.html`);
    
    fs.readFile(templatePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading template:', err);
            return res.status(404).json({
                error: 'Page not found',
                details: `The requested page for ${formattedRegion} ${serviceType} services is not available`
            });
        }
        
        // 替换模板中的占位符
        const pageContent = data
            .replace(/\{\{region\}\}/g, formattedRegion)
            .replace(/\{\{serviceType\}\}/g, serviceType.toUpperCase());
        
        res.send(pageContent);
    });
});

// 保留原有的区域页面路由作为后备
app.get('/regions/:region/:service', (req, res) => {
    const { region, service } = req.params;
    const filePath = path.join(__dirname, 'regions', region, `${service}.html`);
    console.log(`[${req.requestId}] 提供区域页面:`, {
        region,
        service,
        filePath,
        exists: require('fs').existsSync(filePath)
    });
    res.sendFile(filePath);
});

// 添加清除所有排名的API端点
app.post('/api/clear-all-rankings', async (req, res) => {
    const { requestId } = req;
    console.log(`[${requestId}] 收到清除所有排名请求`);
    
    try {
        await rankingService.dbService.clearAllRankings();
        res.json({ message: '所有排名数据已成功清除' });
    } catch (error) {
        console.error(`[${requestId}] 清除排名失败:`, error);
        res.status(500).json({ 
            error: '清除失败',
            details: error.message
        });
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(`[${req.requestId}] 全局错误:`, {
        url: req.url,
        method: req.method,
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
        error: 'Internal server error',
        details: err.message
    });
});

// 404处理 - 确保返回JSON而不是HTML
app.use((req, res) => {
    console.log(`[${req.requestId}] 404未找到:`, {
        url: req.url,
        method: req.method,
        headers: req.headers,
        timestamp: new Date().toISOString()
    });
    res.status(404).json({ 
        error: 'Route not found',
        path: req.url
    });
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', {
        reason,
        timestamp: new Date().toISOString()
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('路由配置:', {
        api: '/api/rankings/:region/:serviceType/:year/:month',
        pages: '/regions/:region/:service'
    });
}); 