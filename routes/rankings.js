// const express = require('express');
// const router = express.Router();
// const RankingService = require('../services/rankingService');

// const rankingService = new RankingService();

// router.get('/rankings', async (req, res) => {
//     try {
//         const { region, serviceType, year, month } = req.query;
        
//         if (!region || !serviceType || !year || !month) {
//             return res.status(400).json({ error: 'Missing required parameters' });
//         }

//         const rankings = await rankingService.generateRankings(region, serviceType, year, month);
//         res.json(rankings);
//     } catch (error) {
//         console.error('Error in rankings route:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// module.exports = router; 

const express = require('express');
const router = express.Router();
const RankingService = require('../services/rankingService');

const rankingService = new RankingService();

// — GET /api/rankings?region=…&serviceType=…&year=…&month=… — generate for one region/serviceType
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


// — POST /api/rankings/generate-all — batch‐generate for every region × serviceType
// 这个接口和api里面的借口重复
router.post('/generate-all', async (req, res) => {
  try {
    const { year, month } = req.body;
    if (!year || !month) {
      return res.status(400).json({ error: 'Missing year or month in request body' });
    }

    // ← paste your full region list here:
    const regions = [
      'China','Hong Kong','Singapore','United States',
      /* … all the other countries … */,
      'Vanuatu'
    ];

    const serviceTypes = ['eor', 'payroll'];
    const results = [];

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

    // return the array of per‐region/serviceType statuses
    res.json(results);

  } catch (error) {
    console.error('Error in POST /generate-all:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate rankings for a specific region and service type
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
