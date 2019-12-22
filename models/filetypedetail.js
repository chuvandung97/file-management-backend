'use strict';
module.exports = (sequelize, DataTypes) => {
  const FileTypeDetail = sequelize.define('filetypedetail', {
    type_id: DataTypes.INTEGER,
    icon: DataTypes.STRING,
    color: DataTypes.STRING
  }, {});
  FileTypeDetail.associate = function(models) {
    FileTypeDetail.belongsTo(models.filetype, {
      foreignKey: 'type_id',
    }),

    FileTypeDetail.hasMany(models.file, {
      foreignKey: 'type_id',
    })

    FileTypeDetail.hasMany(models.filehistory, {
      foreignKey: 'type_id',
    })
  };
  return FileTypeDetail;
};