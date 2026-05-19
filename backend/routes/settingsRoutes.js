const express = require('express');
const settingsController = require('../controllers/settingsController');

const router = express.Router();

router.get('/:userId', settingsController.getSettings);
router.put('/:userId', settingsController.updateSettings);

module.exports = router;
