'use strict';
module.exports = (sequelize, DataTypes) => {
  const Storage = sequelize.define('Storage', {
    name: DataTypes.STRING,
    size: DataTypes.STRING,
    description: DataTypes.STRING,
    active: DataTypes.BOOLEAN
  }, {});
  Storage.associate = function(models) {
    // associations can be defined here
  };
  return Storage;
};