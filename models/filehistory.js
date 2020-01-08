'use strict';
module.exports = (sequelize, DataTypes) => {
  const FileHistory = sequelize.define('filehistory', {
    origin_name: DataTypes.STRING,
    name: DataTypes.STRING,
    type_id: DataTypes.INTEGER,
    size: DataTypes.STRING,
    version:  DataTypes.STRING,
    file_id: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER
  }, {});
  FileHistory.associate = function(models) {
    FileHistory.belongsTo(models.User, {
      foreignKey: 'updated_by',
    })

    FileHistory.belongsTo(models.filetypedetail, {
      foreignKey: 'type_id',
    })
  };
  return FileHistory;
};