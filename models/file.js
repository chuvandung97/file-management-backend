'use strict';
module.exports = (sequelize, DataTypes) => {
  const File = sequelize.define('file', {
    name: DataTypes.STRING,
    type: DataTypes.STRING,
    size: DataTypes.STRING,
    storage_id: DataTypes.INTEGER,
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    created_by: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER
  }, {});
  File.beforeCreate((file, option) => {
    switch (file.type) {
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return file.type = 'application/docx'
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.template':
        return file.type = 'application/dotx'
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return file.type = 'application/xlsx'
      case 'application/vnd.ms-excel':
        return file.type = 'application/msexcel'
      case 'application/vnd.ms-powerpoint':
        return file.type = 'application/mspowerpoint'
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        return file.type = 'application/pptx'
      default:
        return file.type
    }
  });

  File.beforeUpdate((file, option) => {
    switch (file.type) {
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return file.type = 'application/docx'
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.template':
        return file.type = 'application/dotx'
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return file.type = 'application/xlsx'
      case 'application/vnd.ms-excel':
        return file.type = 'application/msexcel'
      case 'application/vnd.ms-powerpoint':
        return file.type = 'application/mspowerpoint'
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        return file.type = 'application/pptx'
      default:
        return file.type
    }
  });

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
    })
  };
  return File;
};