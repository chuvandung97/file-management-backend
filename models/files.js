'use strict';
module.exports = (sequelize, DataTypes) => {
  const Files = sequelize.define('Files', {
    name: DataTypes.STRING,
    type: DataTypes.STRING,
    size: DataTypes.STRING,
    folder_id: DataTypes.INTEGER,
    storage_id: DataTypes.INTEGER,
    active: DataTypes.BOOLEAN
  }, {});
  Files.associate = function(models) {
    // associations can be defined here
  };
  return Files;
};