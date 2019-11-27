var express = require('express');
var router = express.Router();
var models = require('../models')

router.post('/', function(req, res, next) {
    if(!req.token) {
        return res.status(401).json({code: 401, message: "Unauthorized"})
    } else {
        try {
            models.UserToken.findOne({ where: {token: req.token, invoked: false} })
                .then(result => {
                    if(!result) {
                        return res.status(500).json({code: 500, message: 'Unauthorized'})
                    } else {
                        models.sequelize.transaction(t => {
                            return result.update({ invoked: true }, {transaction: t})
                                .then(() => {
                                    return res.status(200).json({code: 200, message: 'Logout success'})
                                })
                                .catch((err1) => {
                                    return res.status(500).json({code: 500, message: 'Logout fail. Can not update UserToken', body: {err1}})
                                })
                        })
                    }
                })
        }
        catch(err2) {
            return res.status(500).json({code: 500, message: "Server error", body: {err2} });
        }
    } 
});

module.exports = router;
