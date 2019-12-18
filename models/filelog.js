'use strict';
module.exports = (sequelize, DataTypes) => {
  const FileLog = sequelize.define('filelog', {
    log: DataTypes.STRING,
    file_id: DataTypes.INTEGER,
    action: DataTypes.STRING,
    updated_by: DataTypes.INTEGER
  }, {});
  FileLog.associate = function(models) {
    // associations can be defined here
  };
  return FileLog;
};