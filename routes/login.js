var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const jwt  = require('jsonwebtoken');
const fs   = require('fs');
const path = require("path");
var privateKey = fs.readFileSync(path.resolve(__dirname, "../keys/private.pem"), 'utf8');
var publicKey = fs.readFileSync(path.resolve(__dirname, "../keys/public.pem"), 'utf8');
var models = require('../models')
var minioClient = require('../config/minio');
var shell = require('shelljs')
var cmdMinio = require('../cmd-minio')

router.post('/', [
    check('email').isEmail(),
    check('email').not().isEmpty().withMessage('Email is required.'),
    check('password').isLength({ min: 5 }),
    check('password').not().isEmpty().withMessage('Password is required.'),
], function(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({code: 422, message: "Invalid data", body: {errors} });
    }
    try {
        var email = req.body.email
        models.User.findOne({where: {email: email}, include: [{model: models.UserToken, as: 'userDetails'}]})
            .then( async (result) => {
                if(!result) {
                    return res.status(500).json({code: 500, message: "Email don't exists"})
                } else {       
                    var data = result.dataValues
                    var user_token_detail = data.userDetails.length > 0 ? (data.userDetails)[0] : data.userDetails
                    var bcrypt_password = await bcrypt.compare(req.body.password, data.password)
                    if(bcrypt_password) {
                        var payload = {
                            id: data.id,
                            name: data.name,
                            email:data.email,
                            password: data.password
                        };
                        const tokenOptions = {
                            algorithm: 'RS256',
                            expiresIn: '24h',
                        }
                        const refreshTokenOptions = {
                            algorithm: 'RS256',
                            expiresIn: '180d',
                        }
                        var token = jwt.sign(payload, privateKey, tokenOptions)
                        var refreshToken = jwt.sign(payload, privateKey, refreshTokenOptions)

                        if(user_token_detail.refresh_token) {
                            jwt.verify(user_token_detail.refresh_token, publicKey, refreshTokenOptions, (err, result2) => {
                                if(err) {
                                    switch (err.name) {
                                        case "JsonWebTokenError":
                                            return res.status(500).json({code: 500, message: "Invalid refresh token", body: {err}})
                                            break;
                                        case "TokenExpiredError":
                                            models.sequelize.transaction(t => {
                                                return user_token_detail.update({token: token, refresh_token: refreshToken, invoked: false}, {transaction: t})
                                                    .then(() => {
                                                        return res.status(200).json({code: 200, message: "Success", body: {token: token, refresh_token: refreshToken}})
                                                    })
                                                    .catch((err2) => {
                                                        return res.status(500).json({code: 500, message: "Update token fail", body: {err2}})
                                                    })
                                            })
                                            break
                                        default:
                                            return res.status(500).json({code: 500, message: "Error", body: {err}})
                                            break      
                                    }
                                } else {
                                    models.sequelize.transaction(t => {
                                        return user_token_detail.update({token: token, invoked: false}, {transaction: t})
                                            .then(() => {
                                                return res.status(200).json({code: 200, message: "Success", body: {token: token}})
                                            })
                                            .catch((err1) => {
                                                return res.status(500).json({code: 500, message: "Update token fail", body: {err1}})
                                            })
                                    })
                                }
                            })    
                        } else {
                            models.sequelize.transaction(t => {
                                return models.UserToken.create({
                                    token: token,
                                    user_id: data.id,
                                    refresh_token: refreshToken,
                                    invoked: false,
                                }, {transaction: t})
                                .then(() => {
                                    return models.Storage.create({
                                        name: data.email,
                                    }, {transaction: t})
                                    .then((storage) => {
                                        return result.update({storage_id: storage.id}, {transaction: t})
                                    })
                                    /* shell.exec(cmdMinio.createPolicy('local'))
                                    shell.exec(cmdMinio.createUser('local', data.email, data.password))
                                    shell.exec(cmdMinio.setUserPolicy('local', data.email)) */
                                })
                            }).then(() => {
                                /* minioClient.makeBucket('aaaaaaaaa1', 'us-east-1', (err) => {
                                    if(err) return res.status(500).json({ code: 500, message: err})
                                    return res.status(200).json({ code: 200, message: "Success", body: { token: token, refreshToken: refreshToken} });
                                }) */
                                return res.status(200).json({ code: 200, message: "Success", body: { token: token, refreshToken: refreshToken} });
                            }).catch((err3) => {
                                return res.status(500).json({ code: 500, message: "Login failed. Can not create UserToken", body: {err3} });
                            })
                        }
                    } else {
                        return res.status(500).json({code: 500, message: "Passwords don't match"})
                    }
                }
            })
        }
        catch (err4) {
            return res.status(500).json({code: 500, message: "Server error", body: {err4} });
        }
    });

module.exports = router;

