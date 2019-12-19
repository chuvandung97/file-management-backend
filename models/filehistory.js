'use strict';
module.exports = (sequelize, DataTypes) => {
  const FileHistory = sequelize.define('filehistory', {
    name: DataTypes.STRING,
    type: DataTypes.STRING,
    size: DataTypes.STRING,
    version:  DataTypes.STRING,
    file_id: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER
  }, {});
  FileHistory.associate = function(models) {
    FileHistory.belongsTo(models.User, {
      foreignKey: 'updated_by',
    })
  };
  return FileHistory;
};