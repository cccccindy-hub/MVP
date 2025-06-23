const pool = require('../config/database');

class DatabaseService {
    constructor() {
        this.pool = pool;
        // 测试连接
        this.testConnection();
    }

    async testConnection() {
        try {
            const connection = await this.pool.getConnection();
            console.log('数据库连接成功');
            connection.release();
        } catch (error) {
            console.error('数据库连接失败:', error.message);
            throw error;
        }
    }

    async getRankings(region, serviceType, year, month) {
        try {
            console.log('从数据库获取排名:', { region, serviceType, year, month });
            
            // First check if data exists
            const [countRows] = await this.pool.query(
                'SELECT COUNT(*) as count FROM rankings WHERE region = ? AND service_type = ? AND year = ? AND month = ?',
                [region, serviceType, year, month]
            );
            
            console.log('Found existing records:', countRows[0].count);
            
            if (countRows[0].count === 0) {
                console.log('No records found in database');
                return [];
            }

            // Get the actual rankings
            const [rows] = await this.pool.query(
                'SELECT * FROM rankings WHERE region = ? AND service_type = ? AND year = ? AND month = ? ORDER BY ranking_position',
                [region, serviceType, year, month]
            );
            
            console.log('Retrieved rankings from database:', {
                count: rows.length,
                firstRecord: rows[0] ? {
                    company_name: rows[0].company_name,
                    ranking_position: rows[0].ranking_position
                } : null
            });
            
            return rows;
        } catch (error) {
            console.error('获取排名时出错:', error);
            throw error;
        }
    }

    async saveRankings(rankings, region, serviceType, year, month) {
        const connection = await this.pool.getConnection();
        try {
            console.log('保存排名到数据库:', {
                region,
                serviceType,
                year,
                month,
                rankingsCount: rankings.length
            });

            // First check if we already have data for this period
            const [existingRows] = await connection.query(
                'SELECT COUNT(*) as count FROM rankings WHERE region = ? AND service_type = ? AND year = ? AND month = ?',
                [region, serviceType, year, month]
            );

            // If we already have data, don't save new data
            if (existingRows[0].count > 0) {
                console.log('Data already exists for this period, skipping save');
                return false;
            }

            await connection.beginTransaction();

            // Insert new rankings
            for (const ranking of rankings) {
                console.log('Saving ranking data:', {
                    company: ranking.company_name,
                    position: ranking.rankingPosition,
                    description: ranking.company_description
                });
                
                await connection.query(
                    `INSERT INTO rankings (
                        region, service_type, year, month, ranking_position,
                        company_name, company_description, strengths, website_link
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        region,
                        serviceType,
                        year,
                        month,
                        ranking.rankingPosition || 0,
                        ranking.company_name,
                        ranking.company_description,
                        JSON.stringify(ranking.strengths),
                        ranking.website
                    ]
                );
            }

            await connection.commit();
            console.log('Rankings saved successfully');
            return true;
        } catch (error) {
            await connection.rollback();
            console.error('Error saving rankings:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    async checkRankingsExist(region, serviceType, year, month) {
        try {
            console.log('检查排名是否存在:', { region, serviceType, year, month });
            const [rows] = await this.pool.query(
                'SELECT COUNT(*) as count FROM rankings WHERE region = ? AND service_type = ? AND year = ? AND month = ?',
                [region, serviceType, year, month]
            );
            const exists = rows[0].count > 0;
            console.log('排名存在:', exists);
            return exists;
        } catch (error) {
            console.error('检查排名存在时出错:', error);
            return false;
        }
    }

    async clearAllRankings() {
        const connection = await this.pool.getConnection();
        try {
            console.log('开始清除所有排名数据...');
            await connection.beginTransaction();

            // 删除所有排名数据
            const [result] = await connection.query('DELETE FROM rankings');
            console.log(`成功删除 ${result.affectedRows} 条排名记录`);

            // 重置自增ID（如果表使用自增ID）
            await connection.query('ALTER TABLE rankings AUTO_INCREMENT = 1');
            
            await connection.commit();
            console.log('所有排名数据已清除');
            return true;
        } catch (error) {
            await connection.rollback();
            console.error('清除排名数据时出错:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = DatabaseService; 