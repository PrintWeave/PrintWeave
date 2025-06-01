'use strict';
import {MigrationParams, RunnableMigration, Sequelize} from "@printweave/models";

export class CreatePrinterManagementMigration implements RunnableMigration<Sequelize.Sequelize> {
    name: string = '20250129163025-create-printer-management-table';

    async up(params: MigrationParams<Sequelize.Sequelize>) {
        const queryInterface = params.context.getQueryInterface();

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

    async down(params: MigrationParams<Sequelize.Sequelize>) {
        const queryInterface = params.context.getQueryInterface();

        // Drop tables in reverse order to handle foreign key constraints
        await queryInterface.dropTable('user_printers');
        await queryInterface.dropTable('printers');
        await queryInterface.dropTable('users');
    }
}
