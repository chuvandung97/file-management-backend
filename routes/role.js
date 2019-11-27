var express = require('express');
var router = express.Router();
var models = require('../models')

router.get('/lists', async function(req, res, next) {
    if(!req.token) {
        return res.status(401).json({code: 401, message: "Unauthorized"})
    } else {
        var roleList = await models.Role.findAll({
            order: [
                ['code', 'ASC']
            ], 
        })
        if(!roleList) {
            return res.status(404).json({code: 404, message: "Không có dữ liệu"})
        } else {
            return res.status(200).json({code: 200, message: "Success", body: {role_list: roleList}})
        }
    }
})

router.post('/add', async function(req, res, next) {
    try {
        var code = req.body.code
        var checkCode = await models.Role.findOne({ where: {code: code} })
        if(checkCode) {
            return res.status(409).json({code: 409, message: "Mã đã được sử dụng"})
        } else {
            models.sequelize.transaction(t => {
                return models.Role.create({
                    code: code,
                    name: req.body.name,
                    description: req.body.description
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

router.delete('/update/:roleId', async function(req, res, next) {
    try {
        var checkRole = await models.Role.findOne({ where: {id: req.params.roleId} })
        if(checkRole) {
            models.sequelize.transaction(t => {
                return checkRole.delete({
                    code: req.body.code,
                    name: req.body.name,
                    description: req.body.description
                }, {transaction: t})
            }).then(() => {
                return res.status(200).json({code: 200, message: "Cập nhật thành công !"})
            }).catch(err => {
                return res.status(500).json({code: 500, message: "Thêm mới thất bại !", body: {err}})
            })
        } else {
            return res.status(404).json({code: 404, message: "Không tồn tại vai trò !"})
        }
    } catch(e) {
        return res.status(500).json({code: 500, message: "Thêm mới thất bại !", body: {e}})
    }
})

router.delete('/delete', function(req, res, next) {

})


module.exports = router;