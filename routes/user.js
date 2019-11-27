var express = require('express');
var router = express.Router();
var models = require('../models')

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

module.exports = router;