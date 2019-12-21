'use strict';
module.exports = (sequelize, DataTypes) => {
  const RoleGroup = sequelize.define('rolegroup', {
    code: DataTypes.STRING,
    name: DataTypes.STRING,
    description: DataTypes.STRING
  }, {});
  RoleGroup.associate = function(models) {
    RoleGroup.hasMany(models.User, {
      foreignKey: 'role_group_id',
    })
  };
  return RoleGroup;
};