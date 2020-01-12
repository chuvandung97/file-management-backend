var express = require('express');
var router = express.Router();
var models = require('../models')
var bcrypt = require('bcrypt');

//lấy danh sách tất cả user
router.get('/lists', async function(req, res, next) {
    if(!req.token) {
        return res.status(401).json({code: 401, message: "Unauthorized"})
    } else {
        var userList = await models.User.findAll({
            attributes: { exclude: ['password'] },
            order: [
                ['name', 'ASC']
            ], 
            include: [ models.role, models.rolegroup ]
        })
        if(!userList) {
            return res.status(404).json({code: 404, message: "Not found user"})
        } else {
            return res.status(200).json({code: 200, message: "Success", body: {user_list: userList}})
        }
    }
})

//lấy thông tin 1 người dùng theo id
router.get('/info', async function(req, res, next) {
    try {
        var userInfo = await models.User.findOne({
            attributes: { exclude: ['password'] },
            include: [models.role, models.rolegroup],
            where: {id: req.query.id}
        }) 
        if(!userInfo) {
            return res.status(404).json({code: 404, message: "Người dùng không tồn tại !"})
        } else {
            return res.status(200).json({code: 200, message: "Success", body: {user_info: userInfo}})           
        }
    } catch (error) {
        return res.status(500).json({code: 500, message: "Lỗi server", body: {error}})
    }
})

//lấy danh sách tất cả user mà có role là 'Group'
router.get('/lists/rolegroup', async function(req, res, next) {
    try {
        var codeId = await models.role.findOne({ 
            attributes: ['id'],
            where: {code: 'Group'}
        })
        if(!codeId) {
            return res.status(404).json({code: 404, message: "Vai trò 'Group' không tồn tại"})
        }
        var userList = await models.User.findAll({
            attributes: { exclude: ['password'] },
            where: {role_id : codeId.dataValues.id, storage_id: null},
            order: [
                ['name', 'ASC']
            ], 
        })
        return res.status(200).json({code: 200, message: "Success", body: {user_list: userList}})
    } catch (error) {
        return res.status(500).json({code: 500, message: "Lỗi server"})
    }
})

//lấy danh sách tất cả user mà có cùng Storage
router.get('/lists/storage', async function(req, res, next) {
    try {
        var storageId = await models.storage.findOne({ 
            attributes: ['id'],
            where: { name: req.query.storage_name }
        })
        if(!storageId) {
            return res.status(404).json({code: 404, message: "Kho không tồn tại"})
        }
        var userList = await models.User.findAll({
            attributes: { exclude: ['password'] },
            where: {storage_id : storageId.dataValues.id},
            include: [models.rolegroup],
            order: [
                ['role_group_id', 'ASC']
            ], 
        })
        return res.status(200).json({code: 200, message: "Success", body: {user_list: userList}})
    } catch (error) {
        return res.status(500).json({code: 500, message: "Lỗi server"})
    }
})

//thêm user vào group
router.post('/add/togroup', async function(req, res, next) {
    try {
        var storageId = await models.group.findOne({
            attributes: ['storage_id'],
            where: {id: req.body.groupId}
        })
        if(!storageId) {
            return res.status(404).json({code: 404, message: "Kho không tồn tại"})
        }
        models.sequelize.transaction(t => {
            return models.User.update(
                { storage_id: storageId.dataValues.storage_id },
                { where: {id: req.body.userIds} }, 
                {transaction: t})
        }).then(() => {
            return res.status(200).json({code: 200, message: "Thêm mới thành công !"})
        }).catch(err => {
            return res.status(500).json({code: 500, message: "Thêm mới thất bại !", body: {err}})
        })
    } catch (error) {
        return res.status(500).json({code: 500, message: "Lỗi server", body: {error}})
    }
})

//xóa người dùng khỏi group
router.post('/remove/fromgroup', async function(req, res, next) {
    try {
        models.sequelize.transaction(t => {
            return models.User.update(
                { storage_id: null },
                { where: {id: req.body.userIds} }, 
                {transaction: t})
        }).then((affectedCount) => {
            return res.status(200).json({code: 200, message: "Xóa thành công ", count: affectedCount})
        }).catch(err => {
            return res.status(500).json({code: 500, message: "Xóa thất bại !", body: {err}})
        })
    } catch (error) {
        return res.status(500).json({code: 500, message: "Lỗi server", body: {error}})
    }
})

//tạo mới 1 user
router.post('/add', async function(req, res, next) {
    try {
        var email = req.body.email
        var checkEmail = await models.User.findOne({ where: {email: email} })
        if(checkEmail) {
            return res.status(409).json({code: 409, message: "Email đã được sử dụng"})
        } else {
            var password = await bcrypt.hash(req.body.password, 10)
            var roleGroup = await models.rolegroup.findOne({ where: {code: 'READ'} })
            models.sequelize.transaction(t => {
                return models.User.create({
                    name: req.body.name,
                    email: email,
                    role_id: req.body.role_id,
                    role_group_id: req.body.role_code == 'Group' ? roleGroup.dataValues.id : null,
                    active: req.body.active,
                    password: password
                }, {transaction: t})
            }).then(() => {
                return res.status(200).json({code: 200, message: "Thêm mới thành công !"})
            }).catch(err => {
                return res.status(500).json({code: 500, message: "Thêm mới thất bại !", body: {err}})
            })
        }
    } catch(e) {
        return res.status(500).json({code: 500, message: "Lỗi", body: {e}})
    } 
})

//cập nhật 1 user
router.post('/update/:userId', async function(req, res, next) {
    try {
        var checkUser = await models.User.findOne({ where: {id: req.params.userId} })
        if(checkUser) {
            var info = {
                name: req.body.name,
                email: req.body.email,
                role_id: req.body.role_id,
                active: req.body.active
            }
            if(req.body.password) {
                var password = await bcrypt.hash(req.body.password, 10)
                info['password'] = password
            }
            models.sequelize.transaction(t => {
                return checkUser.update(info, {transaction: t})
            }).then(() => {
                return res.status(200).json({code: 200, message: "Cập nhật thành công !"})
            }).catch(err => {
                return res.status(500).json({code: 500, message: "Cập nhật thất bại !", body: {err}})
            })
        } else {
            return res.status(404).json({code: 404, message: "Không tồn tại người dùng !"})
        }
    } catch(e) {
        return res.status(500).json({code: 500, message: "Cập nhật thất bại !", body: {e}})
    }
})

//cập nhật 1 role group cho user
router.post('/update/rolegroup/:userId', async function(req, res, next) {
    try {
        var checkUser = await models.User.findOne({ where: {id: req.params.userId} })
        if(checkUser) {
            var code = await models.rolegroup.findOne({ where: {code: req.body.code} })
            var info = {
                role_group_id: code.dataValues.id
            }
            models.sequelize.transaction(t => {
                return checkUser.update(info, {transaction: t})
            }).then(() => {
                return res.status(200).json({code: 200, message: "Cập nhật thành công !"})
            }).catch(err => {
                return res.status(500).json({code: 500, message: "Cập nhật thất bại !", body: {err}})
            })
        } else {
            return res.status(404).json({code: 404, message: "Không tồn tại người dùng !"})
        }
    } catch(e) {
        return res.status(500).json({code: 500, message: "Cập nhật thất bại !", body: {e}})
    }
})

//xóa 1 hoặc nhiều user
router.delete('/delete', function(req, res, next) {
    try {
        models.sequelize.transaction(t => {
            return models.User.destroy({ 
                where: {id: req.query.userIds },
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