module.exports = (sequelize, DataTypes) => {
    const Product = sequelize.define('Product', {
      name: DataTypes.STRING,
      price: DataTypes.FLOAT
    });
  
    Product.associate = (models) => {
      Product.belongsTo(models.Tenant);
    };
  
    return Product;
  };