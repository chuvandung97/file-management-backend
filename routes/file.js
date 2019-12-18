var express = require('express');
var router = express.Router();
var Multer = require("multer");
var minioClient = require('../config/minio');
const models = require('../models')
var upload = Multer({dest: "./uploads/"})
const fs   = require('fs');

//upload.any() up nhieu file
router.post('/upload', upload.single("file"), function(req, res) {
    var metaData = {
        'Content-Type': 'image/*, audio/*, application/*, font/*, text/*, video/*',
    } 
    minioClient.fPutObject(req.query.bucket_name, req.file.originalname, req.file.path, metaData, async function(err, etag) {
        if(err) {
            return res.status(500).json({ code: 500, message: "Tải lên thất bại !", body: {err} });
        }
        try {
            fs.unlink(req.file.destination + req.file.filename, (err) => {
                console.log(err)
            })
            let storage = await models.storage.findOne({
                attributes: ['id'],
                where: { name: req.query.bucket_name }
            })
            if(!storage) {
                return res.status(404).json({code: 404, message: "Kho không tồn tại"})
            }
            models.sequelize.transaction(t => {
                return models.file.create({
                    name: req.file.originalname,
                    type: req.file.mimetype,
                    size: req.file.size,
                    storage_id: storage.dataValues.id,
                    created_by: req.query.created_by
                }, {transaction: t})
                    .then((file) => {
                        let folder_id = req.query.folder_id
                        if(folder_id) {
                            return models.folderfile.create({
                                folder_id: folder_id,
                                file_id: file.id
                            }, {transaction: t})
                        }
                    })
            }).then(() => {
                return res.status(200).json({ code: 200, message: "Tải lên thành công !"});
            }).catch((err1) => {
                return res.status(500).json({code: 500, message: "Tải lên thất bại !", body: {err1}})
            })
        } catch (error) {
            return res.status(500).json({code: 500, message: "Lỗi server !", body: {err}})
        }
    });
});

router.get('/download', function(req, res) {
    minioClient.getObject(req.query.bucket_name, req.query.name, function(err, dataStream) {
        if (err) return res.status(500).json({ code: 500, message: "Tải xuống thất bại !", body: {err} });
        dataStream.pipe(res)
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

//lấy danh sách tất cả file trong folder cha đc chỉ định
router.get('/lists/parentfolder', async function(req, res, next) {
    try {
        var fileList = await models.file.findAll({
            where: {
                active: req.query.active
            },
            order: [
                ['name', 'ASC']
            ], 
            include: [{ 
                model: models.folder,
                where: { id: req.query.folder_id },
                required: true
            },  
                {model: models.User}
            ],
        })
        if(!fileList) {
            return res.status(404).json({code: 404, message: "File không tồn tại"})
        } else {
            return res.status(200).json({code: 200, message: "Success", body: {file_list: fileList}})
        }
    } catch (error) {
        return res.status(500).json({code: 500, message: "Lỗi server", body: {error}})
    }
})

//cập nhật tên file
router.post('/update/:fileId', async function(req, res, next) {
    try {
        let checkFile = await models.file.findOne({where: { id: req.params.fileId }})
        if(checkFile) {
            models.sequelize.transaction(t => {
                return checkFile.update({
                    name: req.body.name,
                }, {transaction: t})
            }).then(() => {
                return res.status(200).json({code: 200, message: "Đổi tên file thành công !"})
            }).catch(err => {
                return res.status(500).json({code: 500, message: "Đổi tên file thất bại !", body: {err}})
            })
        } else {
            return res.status(404).json({code: 404, message: "File không tồn tại !"})
        }
    } catch(e) {
        return res.status(500).json({code: 500, message: "Lỗi server !", body: {e}})
    }
})

//di chuyển file vào thùng rác
router.post('/remove/trash/:fileId', async function(req, res, next) {
    try {
        let checkFile = await models.file.findOne({where: { id: req.params.fileId }})
        if(checkFile) {
            models.sequelize.transaction(t => {
                return checkFile.update({
                    active: false,
                }, {transaction: t})
            }).then(() => {
                return res.status(200).json({code: 200, message: "Xóa file thành công !"})
            }).catch(err => {
                return res.status(500).json({code: 500, message: "Xóa file thất bại !", body: {err}})
            })
        } else {
            return res.status(404).json({code: 404, message: "File không tồn tại !"})
        }
    } catch(e) {
        return res.status(500).json({code: 500, message: "Lỗi server !", body: {e}})
    }
})

//khôi phục file
router.post('/restore', async function(req, res, next) {
    try {
        models.sequelize.transaction(t => {
            return models.file.update(
                { active: true },
                { where: {id: req.body.fileIds} }, 
                {transaction: t})
        }).then(() => {
            return res.status(200).json({code: 200, message: "Khôi phục thành công !"})
        }).catch(err => {
            return res.status(500).json({code: 500, message: "Khôi phục thất bại !", body: {err}})
        })
    } catch (error) {
        return res.status(500).json({code: 500, message: "Lỗi server", body: {error}})
    }
})

//di chuyển file
router.post('/move/:fileId', async function(req, res, next) {
    try {
        if(req.body.oldFolderId === undefined) {
            models.sequelize.transaction(t => {
                return models.folderfile.create({
                    folder_id: req.body.newFolderId,
                    file_id: req.params.fileId
                }, {transaction: t})
            }).then(() => {
                return res.status(200).json({code: 200, message: "Di chuyển thành công !"})
            }).catch(err => {
                return res.status(500).json({code: 500, message: "Di chuyển thất bại !", body: {err}})
            })
        } else {
            models.sequelize.transaction(t => {
                return models.folderfile.update(
                    { folder_id: req.body.newFolderId },
                    { where: {folder_id: req.body.oldFolderId, file_id: req.params.fileId} }, 
                    {transaction: t})
            }).then(() => {
                return res.status(200).json({code: 200, message: "Di chuyển thành công !"})
            }).catch(err => {
                return res.status(500).json({code: 500, message: "Di chuyển thất bại !", body: {err}})
            })
        }
    } catch (error) {
        return res.status(500).json({code: 500, message: "Lỗi server", body: {error}})
    }
})

router.delete('/delete', async function(req, res, next) {
    try {
        await minioClient.removeObjects(req.query.storage, req.query.fileNames)
        models.sequelize.transaction(t => {
            return models.file.destroy({ 
                where: {id: req.query.fileIds },
            }, {transaction: t})
        }).then(affectedRows => {
            return res.status(200).json({code: 200, message: "Xoá thành công ", count: affectedRows})
        }).catch(err => {
            return res.status(500).json({code: 500, message: "Xóa thất bại !", body: {err}})
        })
    } catch (error) {
        return res.status(500).json({code: 500, message: "Lỗi server !", body: {error}})
    }
})

module.exports = router;