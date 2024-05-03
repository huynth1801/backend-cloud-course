'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Tenants', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID, // Sử dụng UUID
        defaultValue: Sequelize.UUIDV4 // Tạo UUID mặc định
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Ternant_1'
      },
      // Other tenant attributes
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      tenantId: {
        type: Sequelize.UUID, // Sử dụng UUID
        allowNull: false,
        references: {
          model: 'Tenants',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      // Other user attributes
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add association constraints
    await queryInterface.addConstraint('Users', {
      fields: ['tenantId'],
      type: 'foreign key',
      name: 'fk_tenantId_user',
      references: {
        table: 'Tenants',
        field: 'id'
      },
      onDelete: 'CASCADE'
    });
  },
  down: async (queryInterface, Sequelize) => {
    // Drop tables if migration is rolled back
    await queryInterface.dropTable('Users');
    await queryInterface.dropTable('Tenants');
  }
};
