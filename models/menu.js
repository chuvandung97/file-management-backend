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
    Menu.hasMany(models.menu, {
      as: 'childMenu',
      foreignKey: 'parent_id',
    })

    Menu.belongsTo(models.menu, {
      as: 'parentMenu',
      foreignKey: 'parent_id',
    })

    Menu.belongsToMany(models.role, {
      through: models.rolemenu,
      foreignKey: 'menu_id'
    })
  };
  return Menu;
};