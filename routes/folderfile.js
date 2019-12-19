var express = require('express');
var router = express.Router();
var models = require('../models')

//danh sách folder và file
router.get('/lists', async function(req, res, next) {
    try {
        let active = req.query.active 
        let search = req.query.search ? req.query.search : false
        let storage = await models.storage.findOne({
            attributes: ['id'],
            where: { name: req.query.storage_id }
        })
        if(!storage) {
            return res.status(404).json({code: 404, message: "Kho không tồn tại"})
        }
        let storageId = storage.dataValues.id
        let fileList = await models.file.findAll({
            where: {
                storage_id: storageId,
                active: active
            },
            include: [{model: models.folder}, {model: models.User}, {model: models.filehistory, include: [models.User]}],
            order: [
                [models.filehistory, 'updatedAt','desc']
            ]
        })

        if(search) {
            var folderCondition = {
                storage_id: storageId,
                active: active
            }
        } else {
            var folderCondition = {
                storage_id: storageId,
                parent_id: req.query.parent_id ? req.query.parent_id : null,
                active: active
            }
        }
        
        let folderList = await models.folder.findAll({
            where: folderCondition,
            order: [
                ['name', 'ASC']
            ], 
            include: [{ model: models.storage, include: [
                models.User
            ] }, { model: models.folder, as: 'children', include: {
                model: models.folder, as: 'children', include: {
                    model: models.folder, as: 'children', include: {
                        model: models.folder, as: 'children', include: {
                            model: models.folder, as: 'children'
                        }
                    }
                }
            } }, {model: models.User}],
        })
        if(active == 1 && !search) {
            var folderFileList = folderList.concat(fileList.filter(el => el.folders == 0))
        } else {
            var folderFileList = folderList.concat(fileList)
        }
        return res.status(200).json({code: 200, message: "Success", body: {folder_file_list: folderFileList}})
    } catch (error) {
        return res.status(500).json({code: 500, message: "Lỗi server", body: {error}})
    }
    
})

module.exports = router;