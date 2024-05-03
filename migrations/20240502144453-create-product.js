'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      price: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true 
      },
      tenantId: {
        type: Sequelize.UUID,
        allowNull: false // Ensure tenantId is not null
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add foreign key constraint
    await queryInterface.addConstraint('Products', {
      fields: ['tenantId'],
      type: 'foreign key',
      name: 'fk_tenantId_product',
      references: {
        table: 'Tenants',
        field: 'id'
      },
      onDelete: 'CASCADE' // Ensure referential integrity
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Products');
  }
};
