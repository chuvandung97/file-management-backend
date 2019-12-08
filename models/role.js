'use strict';
module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('role', {
    code: DataTypes.STRING,
    name: DataTypes.STRING,
    description: DataTypes.STRING
  });
  Role.associate = function(models) {
    Role.hasMany(models.User, {
      foreignKey: 'role_id',
    })

    Role.belongsToMany(models.menu, {
      through: models.rolemenu,
      foreignKey: 'role_id'
    })
  };
  return Role;
};