const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const backupController = require('./../controllers/backupController');

//root route
router
  .route('/')
  .post(authController.protect, backupController.backupDB)
  .get(authController.protect, backupController.directory)
  .delete(authController.protect, backupController.deleteStorageBackups);

router
  .route('/:name')
  .get(authController.protect, backupController.getFileFromStorage);

module.exports = router;
