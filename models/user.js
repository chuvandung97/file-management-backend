'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role_id: DataTypes.INTEGER,
    storage_id: DataTypes.INTEGER,
    active: DataTypes.BOOLEAN
  }, {});
  User.associate = function(models) {
    User.hasMany(models.UserToken, {
      foreignKey: 'user_id',
      as: 'userDetails'
    }),
    User.belongsTo(models.storage, {
      foreignKey: 'storage_id',
    })
    User.belongsTo(models.role, {
      foreignKey: 'role_id',
    })
  };
  return User;
};