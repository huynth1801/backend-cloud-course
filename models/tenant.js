module.exports = (sequelize, DataTypes) => {
  const Tenant = sequelize.define('Tenant', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    name: DataTypes.STRING,
    domain: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  });

  Tenant.associate = (models) => {
    Tenant.hasMany(models.User, { onDelete: 'CASCADE' });
  };

  return Tenant;
};
