var express = require('express');
var router = express.Router();
var Multer = require("multer");
var minioClient = require('../config/minio');

router.post('/', Multer({dest: "./uploads/"}).single("file"), function(req, res) {
    var metaData = {
        'Content-Type': 'multipart/form-data',
    } 
    minioClient.fPutObject(req.query.bucket_name, req.file.originalname, req.file.path, metaData, function(error, etag) {
        if(error) {
            return res.status(500).json({ code: 500, message: "Tải lên thất bại !", body: {error} });
        }
        //res.send(req.file);
        return res.status(200).json({ code: 200, message: "Tải lên thành công !"});
    });
});

module.exports = router;
