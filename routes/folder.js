var express = require('express');
var router = express.Router();
var models = require('../models')
var Sequelize = require('sequelize')
const Op = Sequelize.Op
const compact = require('../compactNameFolderFile')

//lấy danh sách tất cả folder con của folder cha đc chỉ định
router.get('/lists/subfolder', async function(req, res, next) {
    try {
        var folderList = await models.folder.findAll({
            where: {
                parent_id: req.query.folder_id ? req.query.folder_id : null,
                active: true
            },
            order: [
                ['name', 'ASC']
            ], 
            include: [{ model: models.folder, as: 'children', include: {
                model: models.folder, as: 'children', include: {
                    model: models.folder, as: 'children', include: {
                        model: models.folder, as: 'children', include: {
                            model: models.folder, as: 'children'
                        }
                    }
                }
            } }, { model: models.folder, as: 'parent', include: {
                model: models.folder, as: 'parent', include: {
                    model: models.folder, as: 'parent', include: {
                        model: models.folder, as: 'parent', include: {
                            model: models.folder, as: 'parent'
                        }
                    }
                }
            }}, {model: models.User}],
        })
        if(!folderList) {
            return res.status(404).json({code: 404, message: "Thư mục không tồn tại"})
        } else {
            return res.status(200).json({code: 200, message: "Success", body: {folder_list: compact.compactName(folderList)}})
        }
    } catch (error) {
        return res.status(500).json({code: 500, message: "Lỗi server", body: {error}})
    }
})

//lấy danh sách các folder log
router.get('/lists/log/:folderId', async function(req, res, next) {
    try {
        var logList = await models.folderlog.findAll({ 
            where: {folder_id: req.params.folderId},
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

//lấy thông tin của folder đc chỉ định
router.get('/info/:folderId', async function(req, res, next) {
    try {
        var folderInfo = await models.folder.findOne({
            where: {
                id: req.params.folderId,
            },
            include: [{ model: models.folder, as: 'parent', include: {
                model: models.folder, as: 'parent', include: {
                    model: models.folder, as: 'parent', include: {
                        model: models.folder, as: 'parent', include: {
                            model: models.folder, as: 'parent'
                        }
                    }
                }
            }}],
        })
        return res.status(200).json({code: 200, message: "Success", body: {folder_info: folderInfo}})
    } catch (error) {
        return res.status(500).json({code: 500, message: "Lỗi server", body: {error}})
    }
})

//tạo mới 1 folder
router.post('/add', async function(req, res, next) {
    try {
        let storage = await models.storage.findOne({
            attributes: ['id'],
            where: { name: req.body.storage_id }
        })
        if(!storage) {
            return res.status(404).json({code: 404, message: "Kho không tồn tại"})
        }
        let parent_id = req.body.parent_id ? req.body.parent_id : null
        let parentFolderName = await models.folder.findOne({ where: { id: parent_id} })        
        models.sequelize.transaction(t => {
            return models.folder.create({
                parent_id: parent_id,
                origin_name: req.body.name,
                name: req.body.name,
                storage_id: storage.dataValues.id,
                created_by: req.body.created_by,
                active: true,
                folderlogs: [{
                    log: 'trong ' + (parentFolderName ? parentFolderName.dataValues.name.slice(14) : 'Kho của tôi'),
                    action: 'created',
                    updated_by: req.body.updated_by
                }]
            }, { include: [models.folderlog] } ,{transaction: t})
        }).then(() => {
            return res.status(200).json({code: 200, message: "Thêm mới thư mục thành công !"})
        }).catch(error => {
            return res.status(500).json({code: 500, message: "Thêm mới thất bại !", body: {error}})
        })
    } catch(e) {
        return res.status(500).json({code: 500, message: "Thêm mới thất bại !", body: {e}})
    }
})

//đổi tên folder
router.post('/update/:folderId', async function(req, res, next) {
    try {
        let checkFolder = await models.folder.findOne({where: { id: req.params.folderId }})
        let user_id = req.body.user_id
        let old_name = checkFolder.dataValues.name
        let new_name = Date.now() + '-' + req.body.name
        if(checkFolder) {
            models.sequelize.transaction(t => {
                return checkFolder.update({
                    name: new_name,
                }, {transaction: t})
                .then((folder) => {
                    return models.folderlog.create({
                        log: 'từ ' + old_name.slice(14) + ' thành ' + new_name.slice(14),
                        folder_id: folder.dataValues.id,
                        action: 'renamed',
                        updated_by: user_id
                    }, {transaction: t})
                })
            }).then(() => {
                return res.status(200).json({code: 200, message: "Đổi tên thư mục thành công !"})
            }).catch(err => {
                return res.status(500).json({code: 500, message: "Đổi tên thư mục thất bại !", body: {err}})
            })
        } else {
            return res.status(404).json({code: 404, message: "Thư mục không tồn tại !"})
        }
    } catch(e) {
        return res.status(500).json({code: 500, message: "Lỗi server !", body: {e}})
    }
})

//cập nhật sao của folder
router.post('/update/star/:folderId', async function(req, res, next) {
    try {
        let checkFolder = await models.folder.findOne({where: { id: req.params.folderId }})
        if(checkFolder) {
            models.sequelize.transaction(t => {
                return checkFolder.update({
                    is_star: req.body.is_star,
                }, {transaction: t})
            }).then(() => {
                return res.status(200).json({code: 200, message: req.body.is_star ? 'Thêm thành công vào thư mục Có gắn dấu sao' : 'Xóa thành công khỏi thư mục Có gắn dấu sao'})
            }).catch(err => {
                return res.status(500).json({code: 500, message: "Thất bại !", body: {err}})
            })
        } else {
            return res.status(404).json({code: 404, message: "Thư mục không tồn tại !"})
        }
    } catch(e) {
        return res.status(500).json({code: 500, message: "Lỗi server !", body: {e}})
    }
})

//di chuyển folder vào thùng rác
router.post('/remove/trash/:folderId', async function(req, res, next) {
    try {
        let checkFolder = await models.folder.findOne({where: { id: req.params.folderId }})
        if(checkFolder) {
            models.sequelize.transaction(t => {
                return checkFolder.update({
                    active: false,
                }, {transaction: t})
            }).then(() => {
                return res.status(200).json({code: 200, message: "Xóa thư mục thành công !"})
            }).catch(err => {
                return res.status(500).json({code: 500, message: "Xóa thư mục thất bại !", body: {err}})
            })
        } else {
            return res.status(404).json({code: 404, message: "Thư mục không tồn tại !"})
        }
    } catch(e) {
        return res.status(500).json({code: 500, message: "Lỗi server !", body: {e}})
    }
})

//khôi phục folder
router.post('/restore', async function(req, res, next) {
    try {
        let folderIds = req.body.folderIds
        models.sequelize.transaction(t => {
            return models.folder.update(
                { active: true },
                { where: {id: folderIds} }, 
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

//di chuyển folder
router.post('/move/:folderId', async function(req, res, next) {
    try {
        let oldFolderId = req.params.folderId
        let newFolderId = req.body.folderId ? req.body.folderId : null
        let newFolderName = await models.folder.findOne({ where: { id: newFolderId } })
        let name = newFolderName ? newFolderName.dataValues.name.slice(14): 'Kho của tôi'
        models.sequelize.transaction(t => {
            return models.folder.update(
                { parent_id: newFolderId },
                { where: {id: oldFolderId} }, 
                {transaction: t})
                .then(() => {
                    return models.folderlog.create({
                        log: 'tới ' + name,
                        folder_id: oldFolderId,
                        action: 'moved',
                        updated_by: req.body.user_id
                    }, {transaction: t})
                })
        }).then(() => {
            return res.status(200).json({code: 200, message: "Di chuyển thành công !"})
        }).catch(err => {
            return res.status(500).json({code: 500, message: "Di chuyển thất bại !", body: {err}})
        })
    } catch (error) {
        return res.status(500).json({code: 500, message: "Lỗi server", body: {error}})
    }
})

router.delete('/delete', async function(req, res, next) {
    try {
        let fileIdList = await models.folderfile.findAll({
            attributes: ['file_id'],
            where: {
                folder_id: {
                    [Op.or]: req.query.allFolderIds
                }
            }
        })
        let fileIds = fileIdList.map(el => el.dataValues.file_id)
        models.sequelize.transaction(t => {
            return models.folder.destroy({ 
                where: {id: req.query.folderIds },
            }, {transaction: t})
            .then(() => {
                return models.file.destroy({
                    where: {id: fileIds}
                }, {transaction: t})
            })
        }).then(() => {
            return res.status(200).json({code: 200, message: "Xoá thành công !"})
        }).catch(err => {
            return res.status(500).json({code: 500, message: "Xóa thất bại !", body: {err}})
        })
    } catch (error) {
        return res.status(500).json({code: 500, message: "Xóa thất bại !", body: {error}})
    }
})

module.exports = router;