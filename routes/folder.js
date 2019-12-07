var express = require('express');
var router = express.Router();
var models = require('../models')

//lấy danh sách tất cả folder
router.get('/lists', async function(req, res, next) {
    try {
        let storage = await models.storage.findOne({
            attributes: ['id'],
            where: { name: req.query.storage_id }
        })
        if(!storage) {
            return res.status(404).json({code: 404, message: "Kho không tồn tại"})
        }
        var folderList = await models.folder.findAll({
            where: {
                storage_id: storage.dataValues.id,
                parent_id: null,
                active: req.query.active
            },
            order: [
                ['name', 'ASC']
            ], 
            include: [{ model: models.storage, include: [
                models.User
            ] }, { model: models.folder, as: 'child_folder' }, {model: models.User}],
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

//lấy danh sách tất cả folder con của folder cha đc chỉ định
router.get('/lists/subfolder', async function(req, res, next) {
    try {
        let storage = await models.storage.findOne({
            attributes: ['id'],
            where: { name: req.query.storage_id }
        })
        if(!storage) {
            return res.status(404).json({code: 404, message: "Kho không tồn tại"})
        }
        var folderList = await models.folder.findAll({
            where: {
                storage_id: storage.dataValues.id,
                parent_id: req.query.parent_id
            },
            order: [
                ['name', 'ASC']
            ], 
            include: [{ model: models.folder, as: 'child_folder' }, { model: models.folder, as: 'parent_folder' }, {model: models.User}],
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
        models.sequelize.transaction(t => {
            return models.folder.create({
                parent_id: req.body.parent_id,
                name: req.body.name,
                storage_id: storage.dataValues.id,
                created_by: req.body.created_by,
                active: true
            }, {transaction: t})
        }).then(() => {
            return res.status(200).json({code: 200, message: "Thêm mới thư mục thành công !"})
        }).catch(error => {
            return res.status(500).json({code: 500, message: "Thêm mới thất bại !", body: {error}})
        })
    } catch(e) {
        return res.status(500).json({code: 500, message: "Thêm mới thất bại !", body: {e}})
    }
})

//tạo mới 1 folder
router.post('/update/:folderId', async function(req, res, next) {
    try {
        let checkFolder = await models.folder.findOne({where: { id: req.params.folderId }})
        if(checkFolder) {
            models.sequelize.transaction(t => {
                return checkFolder.update({
                    name: req.body.name,
                }, {transaction: t})
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

router.delete('/delete', function(req, res, next) {
    try {
        models.sequelize.transaction(t => {
            return models.folder.destroy({ 
                where: {id: req.query.folderId },
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