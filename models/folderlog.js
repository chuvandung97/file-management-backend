'use strict';
module.exports = (sequelize, DataTypes) => {
  const FolderLog = sequelize.define('folderlog', {
    log: DataTypes.STRING,
    folder_id: DataTypes.INTEGER,
    action: DataTypes.STRING,
    updated_by: DataTypes.INTEGER
  }, {});
  FolderLog.associate = function(models) {
    // associations can be defined here
  };
  return FolderLog;
};