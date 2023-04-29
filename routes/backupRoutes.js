const express = require('express');
const router = express.Router();
const backupController = require('./../controllers/backupController')

//root route
router
  .route('/')
  .post(backupController.backupDB)
  .get(backupController.directory)
  .delete(backupController.deleteStorageBackups);

module.exports = router;
