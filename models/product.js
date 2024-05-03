module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true 
    },
    tenantId: {
      type: DataTypes.UUID, // Assuming tenantId is of type UUID
      allowNull: false // Ensure tenantId is not null
    }
  });

  Product.associate = (models) => {
    Product.belongsTo(models.Tenant, {
      foreignKey: 'tenantId', // Define foreign key column name
      allowNull: false // Ensure tenantId is not null
    });
  };

  return Product;
};
