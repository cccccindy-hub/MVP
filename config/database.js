const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

console.log('Database configuration:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    hasPassword: !!dbConfig.password
});

const pool = mysql.createPool(dbConfig);

// 测试数据库连接
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Successfully connected to the database');
        
        // 确保数据库表存在
        await connection.query(`
            CREATE TABLE IF NOT EXISTS rankings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                region VARCHAR(50) NOT NULL,
                service_type VARCHAR(50) NOT NULL,
                year INT NOT NULL,
                month INT NOT NULL,
                ranking_position INT NOT NULL,
                company_name VARCHAR(255) NOT NULL,
                company_description TEXT,
                strengths JSON,
                website_link VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_ranking (region, service_type, year, month, ranking_position)
            )
        `);
        
        // 测试表是否可以访问
        const [rows] = await connection.query('SELECT COUNT(*) as count FROM rankings');
        console.log('Rankings table verified:', {
            exists: true,
            recordCount: rows[0].count
        });
        
        connection.release();
        return true;
    } catch (err) {
        console.error('Database connection/setup error:', {
            message: err.message,
            code: err.code,
            state: err.sqlState
        });
        throw err;
    }
}

// 立即测试连接
testConnection().catch(err => {
    console.error('Initial database connection failed:', {
        message: err.message,
        code: err.code,
        state: err.sqlState
    });
    process.exit(1);
});

module.exports = pool; 