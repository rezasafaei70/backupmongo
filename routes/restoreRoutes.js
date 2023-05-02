const express = require('express');
const router = express.Router();
const restoreController = require('./../controllers/restoreController')

//root route
router
  .route('/')
  .post(restoreController.permissionRestorer, restoreController.restoreDB);

router
  .route('/local')
  .post(restoreController.permissionRestorer, restoreController.restoreDBFromLocalCopy);

router
  .route('/key')
  .post(restoreController.generateKey);


module.exports = router;
