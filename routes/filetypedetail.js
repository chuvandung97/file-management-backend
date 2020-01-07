var express = require('express');
var router = express.Router();
var models = require('../models')

//Thêm mới loại file được tải lên
router.post('/add', async function(req, res, next) {
    try {
        models.sequelize.transaction(t => {
            return models.filetypedetail.create({
                type_id: req.body.type_id,
                icon: req.body.icon,
                color: req.body.color
            }, {transaction: t})
        })
        .then(() => {
            return res.status(200).json({code: 200, message: "Thêm mới thành công !"})
        }).catch(err => {
            return res.status(500).json({code: 500, message: "Thêm mới thất bại !", body: {err}})
        })
    } catch (error) {
        return res.status(500).json({code: 500, message: "Lỗi server", body: {error}})
    }
})

//xóa loại file
router.delete('/delete/:fileTypeId', async function(req, res, next) {
    try {
        models.sequelize.transaction(t => {
            return models.filetypedetail.destroy({ 
                where: {id: req.params.fileTypeId },
            }, {transaction: t})
        }).then(() => {
            return res.status(200).json({code: 200, message: "Xoá thành công "})
        }).catch(err => {
            return res.status(500).json({code: 500, message: "Xóa thất bại !", body: {err}})
        })
    } catch (error) {
        return res.status(500).json({code: 500, message: "Lỗi server !", body: {error}})
    }
})
module.exports = router;