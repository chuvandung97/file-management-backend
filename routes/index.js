var express = require('express');
var router = express.Router();
const jwt  = require('jsonwebtoken');
const fs   = require('fs');
const path = require("path");
var publicKey = fs.readFileSync(path.resolve(__dirname, "../keys/public.pem"), 'utf8');
var privateKey = fs.readFileSync(path.resolve(__dirname, "../keys/private.pem"), 'utf8');
var models = require('../models')

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('Server run')
});

router.get('/me', function(req, res, next) {
    if(!req.token) {
        return res.status(500).json({code: 500, message: "Token dont exists"})
    } else {
        const signOptions = {
            algorithm: 'RS256',
            maxAge: '24h'
        }
        jwt.verify(req.token, publicKey, signOptions, (err, result) => {
            if(err) {
                return res.status(500).json({
                    code: 500,
                    message: "Expired or Invalid token",
                    body: {err}
                })
            } else {
                models.UserToken.findOne({ where: {token: req.token, invoked: false} })
                    .then(token => {
                        if(token) {
                            return res.status(200).json({
                                code: 200,
                                message: "Success",
                                body: {
                                    id: result.id,
                                    name: result.name,
                                    email: result.email,
                                    role: result.role,
                                    rolegroup: result.rolegroup,
                                    password: result.password
                                }
                            })
                        } else {
                            return res.status(500).json({code: 500, message: "Token is invoked",})
                        }
                    })                     
            }
        });
    }
});

router.get('/checktoken', function(req, res, next) {
    if(!req.token) {
        return res.status(500).json({code: 500, message: "Token do not exists"})
    } else {
        const signOptions = {
            algorithm: 'RS256',
            maxAge: '24h',
        }
        jwt.verify(req.token, publicKey, signOptions, (err, result) => {
            if(err) {
                return res.status(500).json({
                    code: 500,
                    message: "Expired or Invalid token",
                    body: {err}
                })    
            } else {
                models.UserToken.findOne({ where: {token: req.token, invoked: false} })
                    .then(result => {
                        if(result) {
                            return res.status(200).json({code: 200, message: "Token is valid",})
                        } else {
                            return res.status(500).json({code: 500, message: "Token is invoked",})
                        }
                    })                    
            }
        });
    }
})

router.post('/refreshtoken', function(req, res, next) {
    try {
        if(!req.token) {
            return res.status(500).json({code: 500, message: "Token do not exists"})
        } else {
            const tokenOptions = {
                algorithm: 'RS256',
                expiresIn: '24h',
            }
            const refreshTokenOptions = {
                algorithm: 'RS256',
                maxAge: '180d',
            }
            jwt.verify(req.token, publicKey, refreshTokenOptions, (err, result) => {
                if(err) {
                    return res.status(500).json({
                        code: 500,
                        message: "Expired or Invalid refresh token",
                        body: {err}
                    })
                } else {
                    models.UserToken.findOne({ where: {refresh_token: req.token} })
                        .then(result1 => {
                            if(result1) {
                                var payload = {
                                    id: result1.id,
                                    name: result1.name,
                                    email: result1.email,
                                    password: result1.password
                                };
                                jwt.sign(payload, privateKey, tokenOptions, (err2, result2) => {
                                    if(err2) {
                                        return res.status(500).json({code: 500, message: "Create token fail", body: {err2}})
                                    } else {
                                        models.sequelize.transaction(t => {
                                            return result1.update({
                                                token: result2,
                                                where: {
                                                    user_id: result1.id
                                                },
                                                transaction: t
                                            })
                                        })
                                        .then(() => {
                                            return res.status(200).json({code: 200, message: 'Refresh token success', body: {token: result2}})
                                        })
                                        .catch((err3) => {
                                            return res.status(500).json({code: 500, message: 'Refresh token fail', body: {err3}})
                                        })
                                    }
                                })
                            } else {
                                return res.status(500).json({code: 500, message: "Refresh token dont exists"})
                            }
                        })
                }
            })
        }
    }
    catch (err4) {
        return res.status(500).json({code: 500, message: "Server error", body: {err4} });
    }
})


module.exports = router;
