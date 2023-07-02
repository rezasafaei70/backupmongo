const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const restoreController = require('./../controllers/restoreController');

//root route
router
  .route('/')
  .post(authController.protect, restoreController.permissionRestorer, restoreController.restoreDB);

router
  .route('/local')
  .post(
    authController.protect, restoreController.permissionRestorer,
    restoreController.restoreDBFromLocalCopy);

router
  .route('/key')
  .post(authController.protect, restoreController.generateKey);


module.exports = router;
