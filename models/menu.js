'use strict';
module.exports = (sequelize, DataTypes) => {
  const Menu = sequelize.define('menu', {
    parent_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    router_link: DataTypes.STRING,
    icon: DataTypes.STRING,
    active: DataTypes.BOOLEAN,
    order: DataTypes.INTEGER
  }, {});
  Menu.associate = function(models) {
    
  };
  return Menu;
};