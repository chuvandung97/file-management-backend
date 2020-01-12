var express = require('express');
var router = express.Router();
var Multer = require("multer");
var minioClient = require('../config/minio');
const models = require('../models')
var upload = Multer({dest: "./uploads/"})
const fs   = require('fs');
var path = require('path')
const compact = require('../compactNameFolderFile')

//upload.any() up nhieu file
router.post('/upload', upload.single("file"), function(req, res) {
    var metaData = {
        'Content-Type': req.file.mimetype,
    }
    var objectName = Date.now() + '-' + req.file.originalname
    minioClient.fPutObject(req.query.bucket_name, objectName, req.file.path, metaData, async function(err, etag) {
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
            let extensionId = await models.filetype.findOne({ 
                attributes: ['id'],
                where: {extension: path.extname(objectName).toLowerCase()},
                include: [models.filetypedetail] 
            })
            models.sequelize.transaction(t => {
                return models.file.create({
                    origin_name: objectName,
                    name: objectName,
                    type_id: extensionId.dataValues.filetypedetail.dataValues.id,
                    size: req.file.size,
                    storage_id: storage.dataValues.id,
                    created_by: req.query.created_by,
                    filelogs: [{
                        log: 'trong ' + (folderName ? folderName.dataValues.name : 'Kho của tôi'),
                        action: 'created',
                        updated_by: req.query.updated_by
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

//tải bản thay thế
router.post('/upload/replace/:fileId', upload.single("file"), function(req, res) {
    var metaData = {
        'Content-Type': req.file.mimetype,
    } 
    var objectName = Date.now() + '-' + req.file.originalname
    minioClient.fPutObject(req.query.bucket_name, objectName, req.file.path, metaData, async function(err, etag) {
        if(err) {
            return res.status(500).json({ code: 500, message: "Tải lên thất bại !", body: {err} });
        }
        try {
            fs.unlink(req.file.destination + req.file.filename, (err) => {
                console.log(err)
            })
            let fileId = req.params.fileId
            let checkFile = await models.file.findOne({ where: { id: fileId } })
            let user_id = req.query.updated_by
            let extensionId = await models.filetype.findOne({ 
                attributes: ['id'],
                where: {extension: path.extname(objectName).toLowerCase()},
                include: [models.filetypedetail] 
            })
            let file_history = {
                origin_name: checkFile.dataValues.origin_name,
                name: checkFile.dataValues.name,
                type_id: checkFile.dataValues.type_id,
                size: checkFile.dataValues.size,
                version: null,
                file_id: fileId,
                updated_by: user_id,
                createdAt: checkFile.dataValues.createdAt,
                updatedAt: checkFile.dataValues.updatedAt
            }
            let oldfileName = checkFile.dataValues.name
            models.sequelize.transaction(t => {
                return checkFile.update({
                    origin_name: objectName,
                    name: objectName,
                    type_id: extensionId.dataValues.filetypedetail.dataValues.id,
                    size: req.file.size,
                    storage_id: checkFile.dataValues.storage_id,
                    created_by: req.query.created_by,
                }, {transaction: t})
                    .then((file) => {
                        return models.filelog.create({
                            log: 'từ ' + oldfileName.slice(14) + ' thành ' + file.name.slice(14),
                            file_id: fileId,
                            action: 'replaced',
                            updated_by: user_id
                        }, {transaction: t})
                        .then(() => {
                            return models.filehistory.create(file_history, {transaction: t}) 
                        })
                    })
            }).then(() => {
                return res.status(200).json({ code: 200, message: "Thay thế thành công !"});
            }).catch((err1) => {
                return res.status(500).json({code: 500, message: "Thay thế thất bại !", body: {err1}})
            })
        } catch (error) {
            return res.status(500).json({code: 500, message: "Lỗi server !", body: {err}})
        }
    });
})

//lấy danh sách tất cả file trong folder cha đc chỉ định
router.get('/lists/parentfolder', async function(req, res, next) {
    try {
        var fileList = await models.file.findAll({
            where: {
                active: req.query.active
            },
            order: [
                ['createdAt', 'ASC'],
                [models.filehistory, 'updatedAt','desc']
            ], 
            include: [{ 
                model: models.folder,
                where: { id: req.query.folder_id },
                required: true
            },  
                {model: models.User}, {model: models.filetypedetail}, {model: models.filehistory, include: [models.User, models.filetypedetail]}
            ],
        })
        if(!fileList) {
            return res.status(404).json({code: 404, message: "File không tồn tại"})
        } else {
            return res.status(200).json({code: 200, message: "Success", body: {file_list: compact.compactName(fileList)}})
        }
    } catch (error) {
        return res.status(500).json({code: 500, message: "Lỗi server", body: {error}})
    }
})

//lấy danh sách các loại file
router.get('/lists/type', async function(req, res, next) {
    try {
        var typeList = await models.filetype.findAll({attributes: ['id', 'extension']})
        if(!typeList) {
            return res.status(404).json({code: 404, message: "Loại file không tồn tại"})
        } else {
            return res.status(200).json({code: 200, message: "Success", body: {type_list: typeList}})
        }
    } catch (error) {
        return res.status(500).json({code: 500, message: "Lỗi server", body: {error}})
    }
})

//lấy danh sách chi tiết các loại file được tải lên
router.get('/lists/detailtype', async function(req, res, next) {
    try {
        var detailTypeList = await models.filetypedetail.findAll({
            include: [ { model: models.filetype, attributes: { exclude: ['createdAt', 'updatedAt'] }} ]
        })
        if(!detailTypeList) {
            return res.status(404).json({code: 404, message: "Chi tiết loại file không tồn tại"})
        } else {
            return res.status(200).json({code: 200, message: "Success", body: {detail_type_list: detailTypeList}})
        }
    } catch (error) {
        return res.status(500).json({code: 500, message: "Lỗi server", body: {error}})
    }
})

//lấy danh sách các file log
router.get('/lists/log/:fileId', async function(req, res, next) {
    try {
        var logList = await models.filelog.findAll({ 
            where: {file_id: req.params.fileId},
            order: [
                ['createdAt', 'DESC']
            ], 
            include: [models.User]
        })
        return res.status(200).json({code: 200, message: "Success", body: {log_list: logList}})
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
        let new_name = Date.now() + '-' + req.body.name
        if(checkFile) {
            models.sequelize.transaction(t => {
                return checkFile.update({
                    name: new_name,
                    updated_by: user_id,
                }, {transaction: t})
                .then((file) => {
                    return models.filelog.create({
                        log: 'từ ' + old_name.slice(14) + ' thành ' + new_name.slice(14),
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

//cập nhật sao của file
router.post('/update/star/:fileId', async function(req, res, next) {
    try {
        let checkFile = await models.file.findOne({where: { id: req.params.fileId }})
        if(checkFile) {
            models.sequelize.transaction(t => {
                return checkFile.update({
                    is_star: req.body.is_star,
                }, {transaction: t})
            }).then(() => {
                return res.status(200).json({code: 200, message: req.body.is_star ? 'Thêm thành công vào thư mục Có gắn dấu sao' : 'Xóa thành công khỏi thư mục Có gắn dấu sao'})
            }).catch(err => {
                return res.status(500).json({code: 500, message: "Thất bại !", body: {err}})
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
        let fileIds = req.body.fileIds
        models.sequelize.transaction(t => {
            return models.file.update(
                { active: true },
                { where: {id: fileIds} }, 
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
                            log: 'từ Kho của tôi tới ' + newFolderName.dataValues.name.slice(14),
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
                            log: 'từ ' + oldFolderName.dataValues.name.slice(14) + ' tới ' + newFolderName.dataValues.name.slice(14),
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
        models.sequelize.transaction(t => {
            return models.file.destroy({ 
                where: {id: req.query.fileIds },
            }, {transaction: t})
            /* .then(() => {
                minioClient.removeObjects(req.query.storage, req.query.fileNames , function(e) {
                    if (e) {
                        console.log(e)
                    }
                })
            }) */
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