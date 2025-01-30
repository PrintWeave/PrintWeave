'use strict';
import Sequelize from 'sequelize';

export async function up({context: queryInterface}) {
  // Create users table
  await queryInterface.createTable('users', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    username: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false
    },
    email: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    },
    role: {
      type: Sequelize.ENUM('user', 'admin'),
      defaultValue: 'user'
    },
    active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false
    }
  });

  // Create printers table
  await queryInterface.createTable('printers', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    },
    type: {
      type: Sequelize.ENUM('bambu', 'other'),
      allowNull: false
    },
    active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false
    }
  });

  // Create bambu_printers table
  await queryInterface.createTable('bambu_printers', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    printerId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'printers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    type: {
      type: Sequelize.STRING,
      allowNull: false
    },
    ip: {
      type: Sequelize.STRING,
      allowNull: false
    },
    code: {
      type: Sequelize.STRING,
      allowNull: false
    },
    amsVersion: {
      type: Sequelize.STRING,
      allowNull: true
    },
    serial: {
      type: Sequelize.STRING,
      allowNull: false
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false
    }
  });

  // Create user_printers junction table
  await queryInterface.createTable('user_printers', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    printerId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'printers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    permission: {
      type: Sequelize.ENUM('view', 'operate', 'admin'),
      allowNull: false
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false
    }
  });
}

export async function down(queryInterface) {
  // Drop tables in reverse order to handle foreign key constraints
  await queryInterface.dropTable('user_printers');
  await queryInterface.dropTable('bambu_printers');
  await queryInterface.dropTable('printers');
  await queryInterface.dropTable('users');

  // Remove ENUMs
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_users_role;');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_printers_type;');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_user_printers_permission;');
}