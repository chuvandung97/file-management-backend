'use strict';
module.exports = (sequelize, DataTypes) => {
  const FileType = sequelize.define('filetype', {
    extension: DataTypes.STRING,
  }, {});
  FileType.associate = function(models) {
    FileType.hasOne(models.filetypedetail, {
      foreignKey: 'type_id',
    })
  };
  return FileType;
};