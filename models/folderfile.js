'use strict';
module.exports = (sequelize, DataTypes) => {
  const FolderFile = sequelize.define('folderfile', {
    folder_id: DataTypes.INTEGER,
    file_id: DataTypes.INTEGER
  }, {});
  FolderFile.associate = function(models) {
    // associations can be defined here
  };
  return FolderFile;
};