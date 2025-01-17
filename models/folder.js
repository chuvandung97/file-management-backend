'use strict';
module.exports = (sequelize, DataTypes) => {
  const Folder = sequelize.define('folder', {
    parent_id: DataTypes.INTEGER,
    origin_name: DataTypes.STRING,
    name: DataTypes.STRING,
    storage_id: DataTypes.INTEGER,
    description: DataTypes.STRING,
    is_star: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    created_by: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER
  }, {});
  Folder.beforeCreate(folder => {
    let name = Date.now() + '-' + folder.origin_name
    folder.origin_name = folder.name = name
  })

  /* Folder.beforeUpdate(folder => {
    folder.name = Date.now() + '-' + folder.origin_name
  }) */

  Folder.associate = function(models) {
    Folder.belongsTo(models.storage, {
      foreignKey: 'storage_id',
    })

    Folder.belongsTo(models.User, {
      foreignKey: 'created_by'
    })

    Folder.hasMany(models.folder, {
      as: 'children',
      foreignKey: 'parent_id',
      onDelete: 'CASCADE',
      hooks: true,
    })

    Folder.belongsTo(models.folder, {
      as: 'parent',
      foreignKey: 'parent_id',
    })

    Folder.belongsToMany(models.file, {
      through: models.folderfile,
      foreignKey: 'folder_id'
    })

    Folder.hasMany(models.folderlog, {
      foreignKey: 'folder_id',
      onDelete: 'CASCADE',
      hooks: true,
    })
  };
  return Folder;
};