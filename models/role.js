'use strict';
module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('role', {
    code: DataTypes.STRING,
    name: DataTypes.STRING,
    description: DataTypes.STRING
  }, {
    sequelize, 
    modelName: 'role'
  });
  Role.associate = function(models) {
    Role.hasMany(models.User, {
      foreignKey: 'role_id',
    })
  };
  return Role;
};