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
            let folder_id = req.query.folder_id ? req.query.folder_id : null
            let folderName = await models.folder.findOne({ where: { id: folder_id} })   
            models.sequelize.transaction(t => {
                return models.file.create({
                    name: req.file.originalname,
                    type: req.file.mimetype,
                    size: req.file.size,
                    storage_id: storage.dataValues.id,
                    created_by: req.query.created_by,
                    filelogs: [{
                        log: 'at ' + (folderName ? folderName.dataValues.name : 'Drive'),
                        action: 'created',
                        updated_by: req.body.user_id
                    }]
                }, { include: [models.filelog] } ,{transaction: t})
                    .then((file) => {
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

//đổi tên file
router.post('/update/:fileId', async function(req, res, next) {
    try {
        let checkFile = await models.file.findOne({where: { id: req.params.fileId }})
        let user_id = req.body.user_id
        let old_name = checkFile.dataValues.name
        let new_name = req.body.name
        if(checkFile) {
            models.sequelize.transaction(t => {
                return checkFile.update({
                    name: new_name,
                    updated_by: user_id,
                }, {transaction: t})
                .then((file) => {
                    return models.filelog.create({
                        log: old_name + ' to ' + new_name,
                        file_id: file.dataValues.id,
                        action: 'renamed',
                        updated_by: user_id
                    }, {transaction: t})
                })
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
                .then((file) => {
                    return models.filelog.create({
                        log: 'true to false',
                        file_id: file.dataValues.id,
                        action: 'changedActive',
                        updated_by: req.body.user_id
                    }, {transaction: t})
                })
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
        let fileIds = req.body.fileIds
        models.sequelize.transaction(t => {
            return models.file.update(
                { active: true },
                { where: {id: fileIds} }, 
                {transaction: t})
                .then(() => {
                    let filelog = []
                    for (let fileId of fileIds) {
                        filelog.push({
                            log: 'false to true', 
                            file_id: fileId, 
                            action: 'changedActive', 
                            updated_by: req.body.user_id
                        })
                    }
                    return models.filelog.bulkCreate(filelog, {transaction: t})
                })
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
        let fileId = req.params.fileId
        let oldFolderId = req.body.oldFolderId ? req.body.oldFolderId : null
        let newFolderId = req.body.newFolderId
        let oldFolderName = await models.folder.findOne({ where: { id: oldFolderId } })
        let newFolderName = await models.folder.findOne({ where: { id: newFolderId } })
        if(oldFolderId === null) {
            models.sequelize.transaction(t => {
                return models.folderfile.create({
                    folder_id: newFolderId,
                    file_id: fileId
                }, {transaction: t})
                    .then(() => {
                        return models.filelog.create({
                            log: 'Drive to ' + newFolderName.dataValues.name,
                            file_id: fileId,
                            action: 'moved',
                            updated_by: req.body.user_id
                        }, {transaction: t})
                    })
            }).then(() => {
                return res.status(200).json({code: 200, message: "Di chuyển thành công !"})
            }).catch(err => {
                return res.status(500).json({code: 500, message: "Di chuyển thất bại !", body: {err}})
            })
        } else {
            models.sequelize.transaction(t => {
                return models.folderfile.update(
                    { folder_id: newFolderId },
                    { where: {folder_id: oldFolderId, file_id: fileId} }, 
                    {transaction: t})
                    .then(() => {
                        return models.filelog.create({
                            log: oldFolderName.dataValues.name + ' to ' + newFolderName.dataValues.name,
                            file_id: fileId,
                            action: 'moved',
                            updated_by: req.body.user_id
                        }, {transaction: t})
                    })
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