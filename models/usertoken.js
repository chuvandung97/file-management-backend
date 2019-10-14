'use strict';
module.exports = (sequelize, DataTypes) => {
  const UserToken = sequelize.define('UserToken', {
    token: DataTypes.STRING,
    user_id: DataTypes.INTEGER,
    refresh_token: DataTypes.STRING,
    invoked: DataTypes.BOOLEAN
  }, {});
  UserToken.associate = function(models) {
    UserToken.belongsTo(models.User, {
      foreignKey: 'user_id',
      onDelete: 'CASCADE'
    })
  };
  return UserToken;
};