const express = require('express');
const materialController = require('../controllers/materialController');

const router = express.Router();

router.post('/', materialController.createMaterial);
router.get('/', materialController.listMaterials);

module.exports = router;
