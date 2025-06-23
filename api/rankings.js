const express = require('express');
const router = express.Router();
const RankingService = require('../services/rankingService');
const rankingService = new RankingService();

// ——————————————————————————
// 1) Batch‐generate & save ALL regions
// ——————————————————————————
router.post('/generate-all', async (req, res) => {
    // 1a) Define the full universe of regions / serviceTypes / periods
    const regions     = [
        // 热门地区
        'China',
        'Hong Kong',
        'Singapore',
        'United States',
      
       
        'Afghanistan',
        'Armenia',
        'Azerbaijan',
        'Bahrain',
        'Bangladesh',
        'Bhutan',
        'Brunei',
        'Cambodia',
        'Cyprus',
        'Georgia',
        'India',
        'Indonesia',
        'Iran',
        'Iraq',
        'Israel',
        'Japan',
        'Jordan',
        'Kazakhstan',
        'Kuwait',
        'Kyrgyzstan',
        'Laos',
        'Lebanon',
        'Macau',
        'Malaysia',
        'Maldives',
        'Mongolia',
        'Myanmar',
        'Nepal',
        'North Korea',
        'Oman',
        'Pakistan',
        'Palestine',
        'Philippines',
        'Qatar',
        'Saudi Arabia',
        'South Korea',
        'Sri Lanka',
        'Syria',
        'Taiwan',
        'Tajikistan',
        'Thailand',
        'Timor-Leste',
        'Turkey',
        'Turkmenistan',
        'United Arab Emirates',
        'Uzbekistan',
        'Vietnam',
        'Yemen',
      
       
        'Albania',
        'Andorra',
        'Austria',
        'Belarus',
        'Belgium',
        'Bosnia and Herzegovina',
        'Bulgaria',
        'Croatia',
        'Czech Republic',
        'Denmark',
        'Estonia',
        'Finland',
        'France',
        'Germany',
        'Greece',
        'Hungary',
        'Iceland',
        'Ireland',
        'Italy',
        'Latvia',
        'Liechtenstein',
        'Lithuania',
        'Luxembourg',
        'Malta',
        'Moldova',
        'Monaco',
        'Montenegro',
        'Netherlands',
        'North Macedonia',
        'Norway',
        'Poland',
        'Portugal',
        'Romania',
        'Russia',
        'San Marino',
        'Serbia',
        'Slovakia',
        'Slovenia',
        'Spain',
        'Sweden',
        'Switzerland',
        'Ukraine',
        'United Kingdom',
        'Vatican City',
      
    
        'Antigua and Barbuda',
        'Argentina',
        'Bahamas',
        'Barbados',
        'Belize',
        'Bolivia',
        'Brazil',
        'Canada',
        'Chile',
        'Colombia',
        'Costa Rica',
        'Cuba',
        'Dominica',
        'Dominican Republic',
        'Ecuador',
        'El Salvador',
        'Grenada',
        'Guatemala',
        'Guyana',
        'Haiti',
        'Honduras',
        'Jamaica',
        'Mexico',
        'Nicaragua',
        'Panama',
        'Paraguay',
        'Peru',
        'Saint Kitts and Nevis',
        'Saint Lucia',
        'Saint Vincent and the Grenadines',
        'Suriname',
        'Trinidad and Tobago',
        'Uruguay',
        'Venezuela',
      
       
        'Algeria',
        'Angola',
        'Benin',
        'Botswana',
        'Burkina Faso',
        'Burundi',
        'Cabo Verde',
        'Cameroon',
        'Central African Republic',
        'Chad',
        'Comoros',
        'Congo',
        "Côte d'Ivoire",
        'Democratic Republic of the Congo',
        'Djibouti',
        'Egypt',
        'Equatorial Guinea',
        'Eritrea',
        'Eswatini',
        'Ethiopia',
        'Gabon',
        'Gambia',
        'Ghana',
        'Guinea',
        'Guinea-Bissau',
        'Kenya',
        'Lesotho',
        'Liberia',
        'Libya',
        'Madagascar',
        'Malawi',
        'Mali',
        'Mauritania',
        'Mauritius',
        'Morocco',
        'Mozambique',
        'Namibia',
        'Niger',
        'Nigeria',
        'Rwanda',
        'Sao Tome and Principe',
        'Senegal',
        'Seychelles',
        'Sierra Leone',
        'Somalia',
        'South Africa',
        'South Sudan',
        'Sudan',
        'Tanzania',
        'Togo',
        'Tunisia',
        'Uganda',
        'Zambia',
        'Zimbabwe',
      
  
        'Australia',
        'Fiji',
        'Kiribati',
        'Marshall Islands',
        'Micronesia',
        'Nauru',
        'New Zealand',
        'Palau',
        'Papua New Guinea',
        'Samoa',
        'Solomon Islands',
        'Tonga',
        'Tuvalu',
        'Vanuatu'
      ];;            // ← your full region list
    const serviceTypes= ['eor', 'payroll']; // ← your services
    const { year, month } = req.body;                        // pass these in the JSON body
    const results = [];
  
    // 1b) Loop and invoke your existing generate + save logic
    for (const region of regions) {
      for (const serviceType of serviceTypes) {
        try {
          await rankingService.generateRankings(
            region,
            serviceType,
            parseInt(year, 10),
            parseInt(month, 10)
          );
          results.push({ region, serviceType, status: 'ok' });
        } catch (err) {
          results.push({
            region,
            serviceType,
            status: 'error',
            message: err.message
          });
        }
      }
    }
  
    // 1c) Return a summary of what succeeded / failed
    res.json({ year, month, report: results });
  });
// // 获取特定区域、服务类型和时间的排名
// router.get('/:region/:serviceType/:year/:month', async (req, res) => {
//     try {
//         const { region, serviceType, year, month } = req.params;
//         console.log('Received request for rankings:', { region, serviceType, year, month });
        
//         const rankings = await rankingService.generateRankings(region, serviceType, parseInt(year), parseInt(month));
//         console.log('Generated rankings:', rankings);
        
//         res.json(rankings);
//     } catch (error) {
//         console.error('Detailed error in rankings endpoint:', error);
//         res.status(500).json({ 
//             error: 'Failed to fetch rankings',
//             details: error.message,
//             stack: error.stack
//         });
//     }
// });

// module.exports = router; 

// ——————————————————————————
// 2) GET only reads from the DB (no more generation on page‐load)
// ——————————————————————————
router.get('/rankings', async (req, res) => {
  try {
    const { region, serviceType, year, month } = req.query;
    if (!region || !serviceType || !year || !month) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    const rankings = await rankingService.generateRankings(
      region,
      serviceType,
      parseInt(year, 10),
      parseInt(month, 10)
    );
    res.json(rankings);
  } catch (error) {
    console.error('Error in GET /rankings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/:region/:serviceType/:year/:month', async (req, res) => {
    const { region, serviceType, year, month } = req.params;
  
    try {
      console.log('从数据库获取排名:', { region, serviceType, year, month });
  
      // 直接从数据库读取已有的排行记录
      const rankings = await rankingService.getRankings(
        region,
        serviceType,
        parseInt(year, 10),
        parseInt(month, 10)
      );
  
      console.log(`在数据库中找到 ${rankings.length} 条排名记录`);
      res.json(rankings);
  
    } catch (error) {
      console.error('获取排名时出错:', error);
      res.status(500).json({
        error: 'Failed to fetch rankings',
        details: error.message
      });
    }
  });
  
  router.post('/generate', async (req, res) => {
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
  
  module.exports = router;