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
            where: {storage_id: storage.dataValues.id},
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

//lấy một group theo id 
router.get('/list/id', async function(req, res, next) {
    var group = await models.group.findOne({
        where: {id: req.query.groupId},
        include: [{ model: models.storage, include: [
            models.User
        ] }],
    })
    if(!group) {
        return res.status(404).json({code: 404, message: "Nhóm không tồn tại"})
    } else {
        return res.status(200).json({code: 200, message: "Success", body: {group: group}})
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
                created_by: req.body.created_by
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

//cập nhật 1 group
router.post('/update/:groupId', async function(req, res, next) {
    try {
        var name = req.body.name
        var checkGroup = await models.group.findOne({ where: {id: req.params.groupId} })
        if(checkGroup) {
            models.sequelize.transaction(t => {
                return checkGroup.update({
                    name: name,
                    description: req.body.description
                }, {transaction: t})
            }).then(() => {
                return res.status(200).json({code: 200, message: "Cập nhật thành công !"})
            }).catch(err => {
                return res.status(500).json({code: 500, message: "Cập nhật thất bại !", body: {err}})
            })
        } else {
            return res.status(404).json({code: 404, message: "Không tồn tại nhóm !"})
        }
    } catch(e) {
        return res.status(500).json({code: 500, message: "Cập nhật thất bại !", body: {e}})
    }
})

router.delete('/delete', async function(req, res, next) {
    try {
        models.sequelize.transaction(t => {
            return models.group.destroy({ 
                where: {id: req.query.groupIds },
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