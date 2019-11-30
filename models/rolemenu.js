'use strict';
module.exports = (sequelize, DataTypes) => {
  const RoleMenu = sequelize.define('rolemenu', {
    role_id: DataTypes.INTEGER,
    menu_id: DataTypes.INTEGER
  }, {});
  RoleMenu.associate = function(models) {
    // associations can be defined here
  };
  return RoleMenu;
};