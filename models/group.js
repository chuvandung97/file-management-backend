'use strict';
module.exports = (sequelize, DataTypes) => {
  const Group = sequelize.define('group', {
    name: DataTypes.STRING,
    storage_id: DataTypes.INTEGER,
    description: DataTypes.STRING,
    created_by: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER
  }, {});
  Group.associate = function(models) {
    Group.belongsTo(models.storage, {
      foreignKey: 'storage_id',
    })
  };
  return Group;
};