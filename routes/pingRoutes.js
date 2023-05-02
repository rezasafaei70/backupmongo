const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController')

//root route
router
  .route('/')
  .get(backupController.ping);

module.exports = router;
