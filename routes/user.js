var express = require('express');
var router = express.Router();
var models = require('../models')
var bcrypt = require('bcrypt');

router.get('/lists', async function(req, res, next) {
    if(!req.token) {
        return res.status(401).json({code: 401, message: "Unauthorized"})
    } else {
        var userList = await models.User.findAll({
            order: [
                ['name', 'ASC']
            ], 
        })
        if(!userList) {
            return res.status(404).json({code: 404, message: "Not found user"})
        } else {
            return res.status(200).json({code: 200, message: "Success", body: {user_list: userList}})
        }
    }
})

router.post('/add', async function(req, res, next) {
    try {
        var email = req.body.email
        var checkEmail = await models.User.findOne({ where: {email: email} })
        if(checkEmail) {
            return res.status(409).json({code: 409, message: "Email đã được sử dụng"})
        } else {
            var password = await bcrypt.hash(req.body.password, 10)
            models.sequelize.transaction(t => {
                models.User.create({
                    name: req.body.name,
                    email: email,
                    password: password
                }, {transaction: t})
            })
        }
    } catch(e) {
        return res.status(500).json({code: 500, message: "Lỗi", body: {e}})
    }
})

module.exports = router;