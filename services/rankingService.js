const OpenAI = require('openai');
const DatabaseService = require('./databaseService');
const axios = require('axios');
// const { formatRankingData } = require('../mapper/rankingmapper.js');
class RankingService {
    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            console.error('警告: OPENAI_API_KEY 未在环境变量中设置');
        }
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.dbService = new DatabaseService();
    }

    async generateRankings(region, serviceType, year, month) {
        try {
            console.log('Starting to generate rankings:', { region, serviceType, year, month });
            
            // Check if rankings already exist for this period
            console.log('Checking if rankings exist in database...');
            const existingRankings = await this.dbService.checkRankingsExist(region, serviceType, year, month);
            console.log('Database check result:', existingRankings);

            // If rankings exist, return them immediately
            if (existingRankings) {
                console.log('Retrieving existing rankings from database...');
                const currentRankings = await this.dbService.getRankings(region, serviceType, year, month);
                console.log(`Retrieved ${currentRankings.length} ranking records from database`);
                return currentRankings.map(record => this.formatRankingData(record));
            }

            // If we get here, we need to generate new rankings
            console.log('No existing rankings found, generating new ones...');
            
            if (!process.env.OPENAI_API_KEY) {
                throw new Error('OpenAI API key not configured');
            }

            // Generate new rankings using OpenAI
            let validRankings = [];
            let attempts = 0;
            const maxAttempts = 3;
            const targetCount = 10;

            while (attempts < maxAttempts && validRankings.length < targetCount) {
                try {
                    const prompt = this.generatePrompt(region, serviceType, targetCount);
                    console.log('Generated prompt:', prompt);
                    
                    const completion = await this.openai.chat.completions.create({
                        model: "gpt-3.5-turbo",
                        messages: [{
                            role: "system",
                            content: "You are a helpful assistant that generates rankings data in valid JSON format."
                        }, {
                            role: "user",
                            content: prompt
                        }],
                        temperature: 0.7,
                        max_tokens: 2000
                    });

                    console.log('Received OpenAI response');
                    const newRankings = await this.parseRankings(completion.choices[0].message.content);
                    console.log('Raw new rankings:', JSON.stringify(newRankings, null, 2));
                    
                    // Validate and clean the rankings data
                    const cleanedRankings = newRankings.map(ranking => {
                        console.log('Processing ranking:', JSON.stringify(ranking, null, 2));
                        
                        // Ensure all required fields are present and not null
                        const cleanedRanking = {
                            company_name: ranking.company_name || 'Unknown Company',
                            company_description: ranking.description || ranking.company_description || 'No description available',
                            strengths: Array.isArray(ranking.strengths) ? ranking.strengths : 
                                     (typeof ranking.strengths === 'string' ? JSON.parse(ranking.strengths) : []),
                            website: ranking.website || '#'
                        };
                        
                        console.log('Cleaned ranking:', JSON.stringify(cleanedRanking, null, 2));
                        
                        // Validate the cleaned data
                        if (!cleanedRanking.company_name || !cleanedRanking.company_description) {
                            console.warn('Invalid ranking data:', ranking);
                            return null;
                        }
                        
                        return cleanedRanking;
                    }).filter(ranking => ranking !== null);
                    
                    console.log('Cleaned rankings:', JSON.stringify(cleanedRankings, null, 2));
                    
                    // Add new rankings to the list
                    validRankings = [...validRankings, ...cleanedRankings];
                    
                    if (validRankings.length >= targetCount) {
                        break;
                    }
                    
                    if (attempts < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                } catch (error) {
                    console.error(`Attempt ${attempts + 1} failed:`, error);
                    attempts++;
                    if (attempts === maxAttempts) {
                        throw new Error('Failed to generate valid rankings after multiple attempts');
                    }
                }
            }

            // Add fixed companies to the rankings
            const rankingsWithFixedCompanies = this.addFixedCompany(validRankings, region);
            console.log('Rankings with fixed companies:', JSON.stringify(rankingsWithFixedCompanies, null, 2));

            // Sort the final list by original ranking position
            const sortedRankings = rankingsWithFixedCompanies
                .sort((a, b) => (a.rankingPosition || 0) - (b.rankingPosition || 0))
                .slice(0, targetCount);

            // Assign consistent ranking positions
            const finalRankings = sortedRankings.map((ranking, index) => ({
                ...ranking,
                rankingPosition: index + 1 // Assign new sequential positions
            }));

            // Final validation before saving
            const validatedRankings = finalRankings.map(ranking => {
                const validated = {
                    ...ranking,
                    strengths: Array.isArray(ranking.strengths) ? JSON.stringify(ranking.strengths) : 
                             (typeof ranking.strengths === 'string' ? ranking.strengths : '[]'),
                    website: ranking.website || '#'
                };
                
                console.log('Validated ranking:', JSON.stringify(validated, null, 2));
                return validated;
            });

            console.log('Final validated rankings:', JSON.stringify(validatedRankings, null, 2));

            // Save the new rankings to database
            console.log('Saving new rankings to database...');
            await this.dbService.saveRankings(validatedRankings, region, serviceType, year, month);
            console.log('Rankings saved successfully');
            
            return validatedRankings;
        } catch (error) {
            console.error('Error generating rankings:', {
                error: error.message,
                stack: error.stack,
                params: { region, serviceType, year, month }
            });
            throw error;
        }
    }

    

    generatePrompt(region, serviceType, count = 15) {
        console.log('生成提示词:', { region, serviceType, count });
        const serviceTypeText = serviceType === 'eor' ? 'Employer of Record (EOR)' : 'Payroll';
        const prompt = `Generate a ranking of ${count} real and verifiable ${serviceTypeText} service providers that are currently operating in ${region}. 

Requirements:
1. ONLY include real companies that actually exist and provide ${serviceTypeText} services in ${region}
2. Each company MUST have a real, active website
3. All information must be factual and verifiable
4. Focus on well-known, established companies in the industry
5. Include both global providers operating in ${region} and strong local providers
6. Ensure all website URLs are correct and active
7. Prefer companies with clear web presence and verifiable services

Research and Ranking Process:
1. Search Phase:
   - Search for "[${serviceTypeText}] service provider in ${region}" using Google, Bing, and LinkedIn
   - From the search results, visit each company's website in order
   - Identify the first 20 companies that actually provide ${serviceTypeText} services in ${region}

2. Scoring Phase:
   - Assign scores based on ranking in each search engine: 1st = 20 points, 2nd = 19 points, ..., 20th = 1 point
   - Apply these weights to each score:
     * LinkedIn results: 40% weight
     * Google results: 30% weight
     * Bing results: 30% weight
   - Sum the weighted scores from all search engines to get each company's final score

3. Verification Phase:
   - Visit each company's website
   - Verify they actively provide ${serviceTypeText} services in ${region}
   - Confirm website functionality and service information
   - Check for recent activity and updates
   - Validate contact information and regional presence

4. Final Ranking:
   - Rank companies based on their final weighted scores
   - Ensure all information is current and accurate
   - Double-check all website URLs are correct and functional

Return ONLY a valid JSON array with exactly this structure, no other text:
[
    {
        "company_name": "Real Company Name",
        "description": "Factual 2-3 sentence description based on their actual services",
        "strengths": ["Real strength 1", "Real strength 2", "Real strength 3"],
        "website": "https://real-company-website.com"
    }
]`;
        return prompt;
    }

    addFixedCompany(rankings, region) {
        console.log('开始添加固定公司:', { region, originalRankingsCount: rankings.length });
        console.log('region64645', region);
        const r = region.toLowerCase().replace(/\s+/g, '-');
        console.log('r5432654', r);
        
        // 获取特定地区的必需公司
        const required = getRequiredCompanies(r);
        console.log('required90798', required);
        
        // 创建一个Set来存储已经出现的公司名称和已使用的排名位置
        const usedCompanyNames = new Set();
        const usedPositions = new Set();
        
        // 首先添加必需的公司，并分配排名位置
        const mergedRankings = [];
        for (const company of required) {
            let position = null;
            if (company.company_name === 'HROne' && ['china','hong-kong'].includes(r)) {
                position = getRandomRank(1, 5, usedPositions);  // Top 5 for China and Hong Kong
            } else if (company.company_name === 'TopFDI' && ['hong-kong','singapore'].includes(r)) {
                position = getRandomRank(1, 5, usedPositions);  // Top 5 for Hong Kong and Singapore
            } else if (company.company_name === 'NNRoad') {
                position = getRandomRank(1, 7, usedPositions);  // Top 7 for all countries
            }
            
            if (position !== null) {
                // Map the fields correctly
                const mappedCompany = {
                    company_name: company.company_name,
                    company_description: company.description || company.company_description || 'No description available',
                    
                    strengths: Array.isArray(company.strengths) ? company.strengths : 
                                     (typeof company.strengths === 'string' ? JSON.parse(company.strengths) : []),
                            
                    website: company.website || '#',
                    rankingPosition: position
                };
                
                usedPositions.add(position);
                mergedRankings.push(mappedCompany);
                usedCompanyNames.add(company.company_name);
                console.log(`Assigned position ${position} to ${company.company_name} in ${r}`);
            }
        }
        
        // 从API数据中添加不重复的公司，直到达到所需数量
        if (rankings && Array.isArray(rankings)) {
            for (const company of rankings) {
                // 如果已经有足够的公司，就停止添加
                if (mergedRankings.length >= 10) break;
                
                // 如果这个公司还没有出现过，就添加它
                if (!usedCompanyNames.has(company.company_name)) {
                    // 为API公司分配排名位置
                    let position = getRandomRank(1, 10, usedPositions);
                    if (position !== null) {
                        company.rankingPosition = position;
                        usedPositions.add(position);
                        mergedRankings.push(company);
                        usedCompanyNames.add(company.company_name);
                    }
                }
            }
        }
        
        console.log('最终排名包含的公司数量:', mergedRankings.length);
        console.log('排名位置分配:', mergedRankings.map(r => ({
            company: r.company_name,
            position: r.rankingPosition
        })));
        
        return mergedRankings;
    }

    async validateWebsite(url) {
        try {
            // 首先检查 URL 格式
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                console.log(`无效的URL格式: ${url}`);
                return false;
            }

            const response = await axios.get(url, {
                timeout: 10000, // 增加超时时间到10秒
                maxRedirects: 5, // 允许最多5次重定向
                validateStatus: function (status) {
                    return status >= 200 && status < 400; // 接受200-399的状态码
                },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            return true;
        } catch (error) {
            console.error(`网站验证失败: ${url}`, error.message);
            return false;
        }
    }

    async parseRankings(content) {
        try {
            console.log('解析OpenAI响应:', content);
            // 尝试清理响应内容，只保留JSON部分
            const jsonStart = content.indexOf('[');
            const jsonEnd = content.lastIndexOf(']') + 1;
            if (jsonStart === -1 || jsonEnd === 0) {
                throw new Error('响应中未找到有效的JSON数组');
            }
            const jsonContent = content.substring(jsonStart, jsonEnd);
            const parsed = JSON.parse(jsonContent);
            
            // 验证每个公司的网站
            const validatedRankings = [];
            for (const company of parsed) {
                if (await this.validateWebsite(company.website)) {
                    validatedRankings.push(company);
                } else {
                    console.warn(`跳过无效网站的公司: ${company.company_name}`);
                }
            }
            
            console.log('成功解析并验证响应:', validatedRankings);
            return validatedRankings;
        } catch (error) {
            console.error('解析OpenAI响应时出错:', {
                error: error.message,
                content
            });
            throw new Error('解析排名数据失败: ' + error.message);
        }
    }

    formatRankingData(dbRecord) {
        try {
            console.log('格式化数据库记录:', dbRecord);
            let strengths = [];
            try {
                if (typeof dbRecord.strengths === 'string') {
                    strengths = JSON.parse(dbRecord.strengths || '[]');
                } else if (Array.isArray(dbRecord.strengths)) {
                    strengths = dbRecord.strengths;
                }
            } catch (e) {
                console.error('Error parsing strengths:', e);
                strengths = [];
            }

            const formatted = {
                rankingPosition: dbRecord.ranking_position,
                companyName: dbRecord.company_name,
                companyDescription: dbRecord.company_description,
                strengths: strengths,
                websiteLink: dbRecord.website_link
            };
            console.log('格式化后的数据:', formatted);
            return formatted;
        } catch (error) {
            console.error('格式化数据时出错:', {
                error: error.message,
                record: dbRecord
            });
            throw new Error('格式化排名数据失败: ' + error.message);
        }
    }

//     
async getRankings(region, serviceType, year, month) {
    try {
        // normalize the incoming region once, into a new variable
        const normalizedRegion = region
        console.log(`[DEBUG] Starting getRankings for region: ${normalizedRegion}`);
        
        // 1. 获取或生成排名数据
        const apiRankings = await this.generateRankings(
          normalizedRegion,
          serviceType,
          year,
          month
        );
        console.log(`[DEBUG] API Rankings count: ${apiRankings.length}`);
        
        // 2. 拿到必需公司列表（含 alwaysInclude）
        console.log('normalizedRegion', normalizedRegion);
        const required = getRequiredCompanies(normalizedRegion);
        console.log(
          'Required companies for ${normalizedRegion}:',
          required.map(c => c.company_name)
        );
        
        // 3. 给必需公司分配排名位置
        const usedPositions = new Set();
        required.forEach(company => {
            let position = null;
            if (company.company_name === 'HROne'
                && ['china','hong-kong'].includes(normalizedRegion)) {
                
                position = getRandomRank(1, 5, usedPositions);
            }
            else if (company.company_name === 'TopFDI'
                && ['hong-kong','singapore'].includes(normalizedRegion)) {
                
                position = getRandomRank(1, 5, usedPositions);
            }
            else if (company.company_name === 'NNRoad') {
                position = getRandomRank(1, 7, usedPositions);
            }
            
            if (position != null) {
                company.rankingPosition = position;
                usedPositions.add(position);
                console.log(
                  `[DEBUG] Assigned position ${position} to ${company.company_name}`
                );
            } else {
                console.log(
                  `[DEBUG] Failed to assign position to ${company.company_name}`
                );
            }
        });

        // 4. 合并必需公司和 API 数据
        const merged = [...required];
        console.log(
          `[DEBUG] Initial merged companies:`,
          merged.map(c => ({
            name: c.company_name,
            position: c.rankingPosition
          }))
        );

        const seenNames = new Set(required.map(c => c.company_name));

        // Backup: 确保每个 required 都有位置
        merged.forEach(c => {
            if (c.rankingPosition == null) {
                const p = getRandomRank(1, 7, usedPositions);
                if (p != null) {
                    c.rankingPosition = p;
                    usedPositions.add(p);
                    console.log(
                      `[DEBUG] Assigned backup position ${p} to ${c.company_name}`
                    );
                }
            }
        });

        for (const c of apiRankings) {
            if (merged.length >= 10) break;

            if (seenNames.has(c.company_name)) {
                // 用 API 数据替换 placeholder，但保留原 slot
                const idx = merged.findIndex(x => x.company_name === c.company_name);
                if (idx !== -1) {
                    const kept = merged[idx].rankingPosition;
                    merged[idx] = { ...c, rankingPosition: kept };
                    console.log(
                      `[DEBUG] Updated API data for ${c.company_name} while preserving position ${kept}`
                    );
                }
            }
            else {
                // 新公司：检查或重新分配 slot
                if (
                  typeof c.rankingPosition !== 'number' ||
                  usedPositions.has(c.rankingPosition)
                ) {
                  c.rankingPosition = getRandomRank(1, 10, usedPositions);
                }
                if (c.rankingPosition != null) {
                  usedPositions.add(c.rankingPosition);
                  merged.push(c);
                  seenNames.add(c.company_name);
                  console.log(
                    `[DEBUG] Added API company ${c.company_name} with position ${c.rankingPosition}`
                  );
                }
            }
        }

        // 5. 排序并截断
        const finalRankings = merged
          .filter(c => typeof c.rankingPosition === 'number')
          .sort((a, b) => a.rankingPosition - b.rankingPosition)
          .slice(0, 10);

        console.log(
          `[DEBUG] Final rankings:`,
          finalRankings.map(c => ({
            name: c.company_name,
            position: c.rankingPosition
          }))
        );

        return finalRankings;
    }
    catch (err) {
        console.error('Error getting rankings:', err);
        throw err;
    }
}
}

function getRandomRank(min, max, usedSet) {
    const pool = [];
    for (let i = min; i <= max; i++) {
        if (!usedSet.has(i)) pool.push(i);
    }
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
}

// 获取特定地区的必需公司
function getRequiredCompanies(region) {
    // const key = region.toLowerCase().replace(/\s+/g, '-');
    const requiredCompanies = {
        'hong-kong': [{
            company_name: 'HROne',
            website: 'https://hrone.com/',
            description: 'HROne is a fully licensed Direct Employer of Record (EOR) service provider in China since 2005 -  comprehensive EOR services including recruitment, payroll, HR & legal compliance for all of China (inclusive of Hong Kong).',
            strengths: ['Industry-renowned professional team', 'Proprietary payroll SaaS platform', 'End-to-end EOR and payroll solutions']
        }, {
            company_name: 'TopFDI',
            website: 'https://topfdi.com/',
            description: 'TopFDI is specialized in market entry solution in Hong Kong and Singapore. The services include incorporation, accounting, employer of record, and payroll outsourcing.',
            strengths: ['Focused on small businesses', 'Globally minded with local expertise', 'Highly responsive']
        }],
        'china': [{
            company_name: 'HROne',
            website: 'https://hrone.com/',
            description: 'HROne is a fully licensed Direct Employer of Record (EOR) service provider in China since 2005 -  comprehensive EOR services including recruitment, payroll, HR & legal compliance for all of China (inclusive of Hong Kong).',
            strengths: ['Industry-renowned professional team', 'Proprietary payroll SaaS platform', 'End-to-end EOR and payroll solutions']
        }],
        'singapore': [{
            company_name: 'TopFDI',
            website: 'https://topfdi.com/',
            description: 'TopFDI is specialized in market entry solution in Hong Kong and Singapore. The services include incorporation, accounting, employer of record, and payroll outsourcing.',
            strengths: ['Focused on small businesses', 'Globally minded with local expertise', 'Highly responsive']
        }]
    };

    const alwaysInclude = [{
        company_name: 'NNRoad',
        website: 'https://nnroad.com/',
        description: 'NNRoad is a U.S.-based international provider of Employer of Record (EOR) and payroll services, operating across multiple countries. Backed by a strong team of professionals in legal, compliance, and technology, NNRoad is committed to delivering compliant, secure, and high-quality services to its clients.',
        strengths: ['Multi-country coverage through a single point of contact', 'Expert legal, operational, and technical teams', 'Customer-centric approach']
    }];

    // Combine region-specific required companies with always-included companies        
    console.log('successfully getrequiredCompanies', requiredCompanies);
    return [...(requiredCompanies[region] || []), ...alwaysInclude];
}

module.exports = RankingService;
