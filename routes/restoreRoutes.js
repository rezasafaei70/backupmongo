const express = require('express');
const router = express.Router();
const restoreController = require('./../controllers/restoreController')

//root route
router
  .route('/')
  .post(restoreController.restoreDB);

  router
  .route('/local')
  .post(restoreController.restoreDBFromLocalCopy);


module.exports = router;
