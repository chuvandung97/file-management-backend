var express = require('express');
var router = express.Router();
var models = require('../models')

//lấy danh sách tất cả menu
router.get('/lists', async function(req, res, next) {
    try {
        var menuList = await models.menu.findAll({
            order: [
                ['order', 'ASC']
            ], 
            include: [{model: models.menu, as: 'childMenu'}, {model: models.menu, as: 'parentMenu'}]
        })
        if(!menuList) {
            return res.status(404).json({code: 404, message: "Chức năng không tồn tại"})
        } else {
            return res.status(200).json({code: 200, message: "Success", body: {menu_list: menuList}})
        }
    } catch (error) {
        return res.status(500).json({code: 500, message: "Lỗi server", body: {error}})
    }
    
})

//lấy danh sách menu theo vai trò
router.get('/lists/role', async function(req, res, next) {
    try {
        var menuList = await models.menu.findAll({
            order: [
                ['order', 'ASC']
            ], 
            include: [{
                model: models.menu, 
                as: 'childMenu'
            }, {
                model: models.role, 
                where: { code: req.query.role },
                required: true
            }]
        })
        if(!menuList) {
            return res.status(404).json({code: 404, message: "Chức năng không tồn tại"})
        } else {
            return res.status(200).json({code: 200, message: "Success", body: {menu_list: menuList}})
        }
    } catch (error) {
        return res.status(500).json({code: 500, message: "Lỗi server", body: {error}})
    }
    
})

//lấy thông tin 1 menu theo id
router.get('/info', async function(req, res, next) {
    try {
        var menuInfo = await models.menu.findOne({
            include: [{model: models.menu, as: 'parentMenu'}, {model: models.role}],
            where: {id: req.query.id}
        }) 
        if(!menuInfo) {
            return res.status(404).json({code: 404, message: "Chức năng không tồn tại !"})
        } else {
            return res.status(200).json({code: 200, message: "Success", body: {menu_info: menuInfo}})           
        }
    } catch (error) {
        return res.status(500).json({code: 500, message: "Lỗi server", body: {error}})
    }
})


//thêm mới 1 menu
router.post('/add', async function(req, res, next) {
    try {
        var name = req.body.name
        var checkName = await models.menu.findOne({ where: {name: name} })
        if(checkName) {
            return res.status(409).json({code: 409, message: "Tên đã được sử dụng"})
        } else {
            models.sequelize.transaction(t => {
                return models.menu.create({
                    name: name,
                    router_link: req.body.router_link,
                    icon: req.body.icon,
                    order: req.body.order,
                    active: req.body.active,
                    parent_id: req.body.parent_id,
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

//cập nhật 1 menu
router.post('/update/:menuId', async function(req, res, next) {
    try {
        var checkMenu = await models.menu.findOne({ where: {id: req.params.menuId} })
        if(checkMenu) {
            models.sequelize.transaction(t => {
                return checkMenu.update({
                    name: req.body.name,
                    parent_id: req.body.parent_id,
                    router_link: req.body.router_link,
                    icon: req.body.icon,
                    order: req.body.order,
                    active: req.body.active
                }, {transaction: t})
            }).then(() => {
                return res.status(200).json({code: 200, message: "Cập nhật thành công !"})
            }).catch(err => {
                return res.status(500).json({code: 500, message: "Cập nhật thất bại !", body: {err}})
            })
        } else {
            return res.status(404).json({code: 404, message: "Không tồn tại chức năng !"})
        }
    } catch(e) {
        return res.status(500).json({code: 500, message: "Cập nhật thất bại !", body: {e}})
    }
})

router.post('/add/role', async function(req, res, next) {
    try {
        var checkRole = await models.rolemenu.findOne({
            where: {
                menu_id: req.body.menu_id, 
                role_id: req.body.role_id
            }
        })
        if(checkRole) {
            return res.status(500).json({code: 500, message: "Vai trò đã được sử dụng !"})
        }
        models.sequelize.transaction(t => {
            return models.rolemenu.create({
                menu_id: req.body.menu_id,
                role_id: req.body.role_id
            }, {transaction: t})
        }).then(() => {
            return res.status(200).json({code: 200, message: "Thêm vai trò thành công !"})
        }).catch(err => {
            return res.status(500).json({code: 500, message: "Thêm vai trò thất bại !", body: {err}})
        })
    } catch(e) {
        return res.status(500).json({code: 500, message: "Thêm vai trò thất bại !", body: {e}})
    }
})

//xóa menu
router.delete('/delete', function(req, res, next) {
    try {
        models.sequelize.transaction(t => {
            return models.menu.destroy({ 
                where: {id: req.query.menuIds },
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

//xóa role khỏi menu
router.delete('/delete/role', async function(req, res, next) {
    try {
        var checkRole = await models.rolemenu.findOne({
            where: {
                menu_id: req.query.menu_id, 
                role_id: req.query.role_id
            }
        })
        if(!checkRole) {
            return res.status(404).json({code: 404, message: "Vai trò không tồn tại !"})
        }
        models.sequelize.transaction(t => {
            return checkRole.destroy({ 
                where: {id: checkRole.dataValues.id },
            }, {transaction: t})
        }).then(() => {
            return res.status(200).json({code: 200, message: "Xoá thành công "})
        }).catch(err => {
            return res.status(500).json({code: 500, message: "Xóa thất bại !", body: {err}})
        })
    } catch (error) {
        return res.status(500).json({code: 500, message: "Xóa thất bại !", body: {error}})
    }
})

module.exports = router;