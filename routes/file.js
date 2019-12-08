var express = require('express');
var router = express.Router();
var Multer = require("multer");
var minioClient = require('../config/minio');
const models = require('../models')

router.post('/upload', Multer({dest: "./uploads/"}).single("file"), function(req, res) {
    var metaData = {
        'Content-Type': 'image/*, audio/*, application/*, font/*, text/*, video/*',
    } 
    minioClient.fPutObject(req.query.bucket_name, req.file.originalname, req.file.path, metaData, async function(err, etag) {
        if(err) {
            return res.status(500).json({ code: 500, message: "Tải lên thất bại !", body: {err} });
        }
        try {
            let storage = await models.storage.findOne({
                attributes: ['id'],
                where: { name: req.query.bucket_name }
            })
            if(!storage) {
                return res.status(404).json({code: 404, message: "Kho không tồn tại"})
            }
            console.log(req.file)
            models.sequelize.transaction(t => {
                return models.file.create({
                    name: req.file.originalname,
                    type: req.file.mimetype,
                    size: req.file.size,
                    storage_id: storage.dataValues.id,
                    created_by: req.query.created_by
                }, {transaction: t})
            }).then(() => {
                return res.status(200).json({ code: 200, message: "Tải lên thành công !"});
            }).catch((err1) => {
                return res.status(500).json({code: 500, message: "Tải lên thất bại !", body: {err1}})
            })
        } catch (error) {
            return res.status(500).json({code: 500, message: "Lỗi server !", body: {err}})
        }
        //res.send(req.file);
    });
});

router.get('/download', function(req, res) {
    minioClient.presignedGetObject(req.query.bucket_name, req.query.name, 60, function(err, presignedUrl) {
        if (err) return res.status(500).json({ code: 500, message: "Tải xuống thất bại !", body: {err} });
        res.status(200).json({ code: 200, message: "Tải xuống thành công !", body: {url: presignedUrl} })
    }) 
});

//lấy danh sách tất cả file
router.get('/lists', async function(req, res, next) {
    try {
        let storage = await models.storage.findOne({
            attributes: ['id'],
            where: { name: req.query.storage_id }
        })
        if(!storage) {
            return res.status(404).json({code: 404, message: "Kho không tồn tại"})
        }
        var fileList = await models.file.findAll({
            where: {
                storage_id: storage.dataValues.id,
                active: req.query.active
            },
            include: [{model: models.folder}, {model: models.User}]
        })
        if(!fileList) {
            return res.status(404).json({code: 404, message: "Chức năng không tồn tại"})
        } else {
            return res.status(200).json({code: 200, message: "Success", body: {file_list: fileList}})
        }
    } catch (error) {
        return res.status(500).json({code: 500, message: "Lỗi server", body: {error}})
    }
    
})

module.exports = router;