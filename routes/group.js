var express = require('express');
var router = express.Router();
var models = require('../models')

//lấy danh sách tất cả group
router.get('/lists', async function(req, res, next) {
    var groupList = await models.group.findAll({
        order: [
            ['name', 'ASC']
        ], 
        include: [{ model: models.storage, include: [
            models.User
        ] }],
    })
    if(!groupList) {
        return res.status(404).json({code: 404, message: "Not found user"})
    } else {
        return res.status(200).json({code: 200, message: "Success", body: {group_list: groupList}})
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

//tạo mới 1 group
router.post('/add', async function(req, res, next) {
    try {
        var name = req.body.name
        var checkName = await models.group.findOne({ where: {name: name} })
        if(checkName) {
            return res.status(409).json({code: 409, message: "Tên nhóm đã được sử dụng"})
        } else {
            models.sequelize.transaction(t => {
                return models.group.create({
                    name: name,
                    description: req.body.description,
                    storage: {
                        name: name,
                        active: true,
                    }
                }, {
                    include: [ models.storage ] 
                }, {transaction: t})
            }).then(() => {
                return res.status(200).json({code: 200, message: "Thêm mới thành công !"})
            }).catch(error => {
                return res.status(500).json({code: 500, message: "Thêm mới thất bại !", body: {error}})
            })
        }
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