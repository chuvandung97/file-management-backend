'use strict';
module.exports = (sequelize, DataTypes) => {
  const File = sequelize.define('file', {
    name: DataTypes.STRING,
    type: DataTypes.STRING,
    size: DataTypes.STRING,
    storage_id: DataTypes.INTEGER,
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    created_by: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER
  }, {});
  File.associate = function(models) {
    File.belongsTo(models.User, {
      foreignKey: 'created_by'
    })

    File.belongsTo(models.User, {
      foreignKey: 'updated_by'
    })

    File.belongsTo(models.storage, {
      foreignKey: 'storage_id',
    })
  };
  return File;
};