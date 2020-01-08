var express = require('express');
var router = express.Router();
var models = require('../models')
var Sequelize = require('sequelize')
const Op = Sequelize.Op
const compact = require('../compactNameFolderFile')

//danh sách folder và file  
router.get('/lists', async function(req, res, next) {
    try {
        let active = req.query.active ? req.query.active : true
        let search = req.query.search ? req.query.search : false
        var userId = req.query.userid
        let name = req.query.name
        let size = req.query.size
        let time = req.query.time
        var owner = req.query.owner
        let storage = await models.storage.findOne({
            attributes: ['id'],
            where: { name: req.query.storage_id }
        })
        if(!storage) {
            return res.status(404).json({code: 404, message: "Kho không tồn tại"})
        }
        if(owner && owner.includes('@gmail.com')) {
            var userId = await models.User.findOne({
                attributes: ['id'],
                where: { email: owner }
            })
        } 
        
        var fileCondition = {
            storage_id: storage.dataValues.id,
            active: active
        }
        if(name) {
            fileCondition.name = { [Op.substring]: name }
        }
        if(owner) {
            switch (owner) {
                case 'me':
                    fileCondition.created_by = { [Op.eq]: userId }
                    break;
                case 'notme':
                    fileCondition.created_by = { [Op.ne]: userId }
                    break
                default:
                    fileCondition.created_by = { [Op.eq]: userId.dataValues.id }
                    break;
            }
        }
        if(size) {
            let sizeArr = size.split(':')
            switch (sizeArr[0]) {
                case 'less':
                    fileCondition.size = { [Op.lt]: Number(sizeArr[1]) }
                    break;
                case 'more':
                    fileCondition.size = { [Op.gt]: Number(sizeArr[1]) }
                    break
                default:
                    fileCondition.size = { [Op.between]: [Number(sizeArr[1]), Number(sizeArr[3])] }
                    break;
            } 
        }
        if(time) {
            let timeArr = time.split(':')
            switch (timeArr[0]) {
                case 'after':
                    fileCondition.updatedAt = { [Op.gt]: timeArr[1] }
                    break;
                case 'before':
                    fileCondition.updatedAt = { [Op.between]: [timeArr[3], timeArr[1]] }
                    break
                default:
                    fileCondition.updatedAt = null
                    break;
            }
        }
        let fileList = await models.file.findAll({
            where: fileCondition,
            include: [{model: models.folder}, {model: models.User}, {model: models.filetypedetail}, {model: models.filehistory, include: [models.User, models.filetypedetail]}],
            order: [
                [models.filehistory, 'updatedAt','desc'],
                ['createdAt', 'ASC']
            ]
        })

        if(search) {
            var folderCondition = fileCondition
        } else {
            var folderCondition = {
                storage_id: storage.dataValues.id,
                parent_id: req.query.parent_id ? req.query.parent_id : null,
                active: active
            }

        }
        
        if(folderCondition.size) {
            var folderList = []
        } else {
            var folderList = await models.folder.findAll({
                where: folderCondition,
                order: [
                    ['createdAt', 'ASC']
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
        }
        folderList = compact.compactName(folderList)
        fileList = compact.compactName(fileList)
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