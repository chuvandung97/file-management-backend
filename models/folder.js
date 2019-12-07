'use strict';
module.exports = (sequelize, DataTypes) => {
  const Folder = sequelize.define('folder', {
    parent_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    storage_id: DataTypes.INTEGER,
    description: DataTypes.STRING,
    active: DataTypes.BOOLEAN,
    created_by: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER
  }, {});
  Folder.associate = function(models) {
    Folder.belongsTo(models.storage, {
      foreignKey: 'storage_id',
    })

    Folder.belongsTo(models.User, {
      foreignKey: 'created_by'
    })

    Folder.hasMany(models.folder, {
      as: 'child_folder',
      foreignKey: 'parent_id',
      onDelete: 'CASCADE',
      hooks: true,
    })

    Folder.belongsTo(models.folder, {
      as: 'parent_folder',
      foreignKey: 'parent_id',
    })
  };
  return Folder;
};