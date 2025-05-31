import {BambuPrinter} from "bambu.printer.model.js";
import {MigrationParams, RunnableMigration, Sequelize} from "@printweave/models";

export default class BambuPrinterMigration implements RunnableMigration<Sequelize.Sequelize> {
    async down(params: MigrationParams<Sequelize.Sequelize>) {
        // Drop the bambu_printers table
        const queryInterface = params.context.getQueryInterface();
        await queryInterface.dropTable('bambu_printers');
    }

    name: string = "BambuPrinterMigration";

    async up(params: MigrationParams<Sequelize.Sequelize>) {
        // Create the bambu_printers table
        const queryInterface = params.context.getQueryInterface();
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
    }
}
