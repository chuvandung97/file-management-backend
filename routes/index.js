var express = require('express');
var router = express.Router();
var Multer = require("multer");
var minioClient = require('../config/minio');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
