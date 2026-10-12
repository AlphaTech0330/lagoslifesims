const express = require('express');
const router = express.Router();

const { 
  getMarketPrices, 
  travel, 
  buyItem, 
  sellItem 
} = require('../controllers/gameController');

const { protect } = require('../middleware/authMiddleware');

router.get('/market', protect, getMarketPrices);
router.post('/travel', protect, travel);
router.post('/trade/buy', protect, buyItem);
router.post('/trade/sell', protect, sellItem);

module.exports = router;