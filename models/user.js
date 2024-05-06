module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    username: DataTypes.STRING,
    email: DataTypes.STRING, // Thêm trường email
    password: DataTypes.STRING,
  });

  User.associate = (models) => {
    User.belongsTo(models.Tenant);
  };

  return User;
};
