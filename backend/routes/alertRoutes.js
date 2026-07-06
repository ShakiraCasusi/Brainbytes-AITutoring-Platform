const express = require("express");
const router = express.Router();

const alertController = require("../controllers/alertController");

router.post("/alert", alertController.receiveAlert);

module.exports = router;