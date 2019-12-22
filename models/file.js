'use strict';
module.exports = (sequelize, DataTypes) => {
  const File = sequelize.define('file', {
    name: DataTypes.STRING,
    type_id: DataTypes.INTEGER,
    size: DataTypes.STRING,
    storage_id: DataTypes.INTEGER,
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    created_by: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER
  }, {});
  File.associate = function(models) {
    File.belongsTo(models.User, {
      foreignKey: 'created_by'
    })

    /* File.belongsTo(models.User, {
      foreignKey: 'updated_by'
    }) */

    File.belongsTo(models.storage, {
      foreignKey: 'storage_id',
    })

    File.belongsToMany(models.folder, {
      through: models.folderfile,
      foreignKey: 'file_id'
    })

    File.hasMany(models.filehistory, {
      foreignKey: 'file_id',
      onDelete: 'CASCADE',
      hooks: true,
    })

    File.hasMany(models.filelog, {
      foreignKey: 'file_id',
      onDelete: 'CASCADE',
      hooks: true,
    }),

    File.belongsTo(models.filetypedetail, {
      foreignKey: 'type_id',
    })
  };
  return File;
};