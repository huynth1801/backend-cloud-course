// models/invoice.js

module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define("Invoice", {
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("ordered", "cancelled"),
      defaultValue: "ordered",
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  });

  Invoice.associate = (models) => {
    Invoice.belongsTo(models.Tenant, {
      foreignKey: "tenantId",
      allowNull: false,
    });
    Invoice.belongsTo(models.User, {
      foreignKey: "userId",
      allowNull: false,
    });
  };

  return Invoice;
};
