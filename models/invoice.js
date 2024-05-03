module.exports = (sequelize, DataTypes) => {
    const Invoice = sequelize.define('Invoice', {
      amount: DataTypes.FLOAT,
      status: {
        type: DataTypes.ENUM('pending', 'paid', 'cancelled'),
        defaultValue: 'pending'
      }
    });
  
    Invoice.associate = (models) => {
      Invoice.belongsTo(models.Tenant);
      Invoice.belongsTo(models.User);
    };
  
    return Invoice;
  };