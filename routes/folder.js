var express = require('express');
var router = express.Router();
var models = require('../models')

//lấy danh sách tất cả folder con của folder cha đc chỉ định
router.get('/lists/subfolder', async function(req, res, next) {
    try {
        var folderList = await models.folder.findAll({
            where: {
                parent_id: req.query.folder_id,
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
            return res.status(200).json({code: 200, message: "Success", body: {folder_list: folderList}})
        }
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
                name: req.body.name,
                storage_id: storage.dataValues.id,
                created_by: req.body.created_by,
                active: true,
                folderlogs: [{
                    log: 'at ' + (parentFolderName ? parentFolderName.dataValues.name : 'Drive'),
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
        let new_name = req.body.name
        if(checkFolder) {
            models.sequelize.transaction(t => {
                return checkFolder.update({
                    name: new_name,
                }, {transaction: t})
                .then((folder) => {
                    return models.folderlog.create({
                        log: old_name + ' to ' + new_name,
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

//di chuyển folder vào thùng rác
router.post('/remove/trash/:folderId', async function(req, res, next) {
    try {
        let checkFolder = await models.folder.findOne({where: { id: req.params.folderId }})
        if(checkFolder) {
            models.sequelize.transaction(t => {
                return checkFolder.update({
                    active: false,
                }, {transaction: t})
                .then((folder) => {
                    return models.folderlog.create({
                        log: 'true to false',
                        folder_id: folder.dataValues.id,
                        action: 'changedActive',
                        updated_by: req.body.user_id
                    }, {transaction: t})
                })
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
            .then(() => {
                let folderlog = []
                for (let folderId of folderIds) {
                    folderlog.push({
                        log: 'false to true', 
                        folder_id: folderId, 
                        action: 'changedActive', 
                        updated_by: req.body.user_id
                    })
                }
                return models.folderlog.bulkCreate(folderlog, {transaction: t})
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

//di chuyển folder
router.post('/move/:folderId', async function(req, res, next) {
    try {
        let oldFolderId = req.params.folderId
        let newFolderId = req.body.folderId
        let newFolderName = await models.folder.findOne({ where: { id: newFolderId } })
        models.sequelize.transaction(t => {
            return models.folder.update(
                { parent_id: newFolderId },
                { where: {id: oldFolderId} }, 
                {transaction: t})
                .then(() => {
                    return models.folderlog.create({
                        log: 'To ' + newFolderName.dataValues.name,
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

router.delete('/delete', function(req, res, next) {
    try {
        models.sequelize.transaction(t => {
            return models.folder.destroy({ 
                where: {id: req.query.folderIds },
            }, {transaction: t})
        }).then(affectedRows => {
            return res.status(200).json({code: 200, message: "Xoá thành công ", count: affectedRows})
        }).catch(err => {
            return res.status(500).json({code: 500, message: "Xóa thất bại !", body: {err}})
        })
    } catch (error) {
        return res.status(500).json({code: 500, message: "Xóa thất bại !", body: {error}})
    }
})

module.exports = router;