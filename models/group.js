'use strict';
module.exports = (sequelize, DataTypes) => {
  const Group = sequelize.define('group', {
    name: DataTypes.STRING,
    member_amount: DataTypes.INTEGER,
    storage_id: DataTypes.INTEGER,
    description: DataTypes.STRING
  }, {});
  Group.associate = function(models) {
    Group.belongsTo(models.storage, {
      foreignKey: 'storage_id',
    })
  };
  return Group;
};