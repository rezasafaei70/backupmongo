const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router
  .route('/signin')
  .post(authController.signin);

module.exports = router;
