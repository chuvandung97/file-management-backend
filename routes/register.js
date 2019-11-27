var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
var models = require('../models')

router.post('/', [
    check('email').isEmail(),
    check('email').not().isEmpty().withMessage('Email is required.'),
    check('password').isLength({ min: 5 }),
    check('password').not().isEmpty().withMessage('Password is required.'),
    check('name').not().isEmpty().withMessage('Name is required.'),
], async function(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({code: 422, message: "Invalid data", body: {errors} });
    }
    try {
        var name = req.body.name
        var email = req.body.email
        var password = await bcrypt.hash(req.body.password, 10)
        var User = models.User
        models.sequelize.transaction(t => {
            return User.findOrCreate({ 
                where: {email: email},
                defaults: {
                    name: name,
                    password: password,
                },
                transaction: t})
            .spread((user, created) => {
                if(!user) {
                    return res.status(500).json({ code: 500, message: "Register failed. Can not create User"});
                }
                if(!created) {
                    return res.status(409).json({code: 409, message: 'Email is already used'})
                } else {
                    return res.status(200).json({code: 200, message: 'Success'})
                }
            })
            .catch((err2) => {
                return res.status(500).json({ code: 500, message: "Register failed. Can not create User", body: {err2} });
            })
        })
    }
    catch (err3) {
        return res.status(500).json({code: 500, message: "Server error", body: {err3} });
    }
});

module.exports = router;