import {BasePrinter, IPluginManager, Plugin, Express, RunnableMigration} from "@printweave/models";
import {BambuPrinter} from "./bambu.printer.model.js";
import {ModelStatic, ModelCtor} from "@printweave/models";
import {IPrintWeaveApp, Logger} from "@printweave/models";
import {bambuPrinterRoutes} from "./routes/bambu.printer.route.js";
import {BambuWebsocketSubscriptionManager} from "./websockets.manager.js";
import {ConnectionManager} from "./connection/ConnectionManager.js";
import BambuPrinterMigration from "./migrations/bambuprinter.migrations.js";

export default class PrinterPlugin extends Plugin {
    migrations: RunnableMigration<any>[] = [
        new BambuPrinterMigration()
    ];

    private bambuWebsocketSubscriptionManager = new BambuWebsocketSubscriptionManager();
    private connectionManager: ConnectionManager = new ConnectionManager(this);

    private static instance: PrinterPlugin;

    name = "@printweave/bambu-printer";

    printerType = "bambu";

    printerClass: ModelStatic<BasePrinter> = BambuPrinter;
    models: ModelCtor[] = [BambuPrinter];
    websocketManagers = [this.bambuWebsocketSubscriptionManager];

    constructor(logger: Logger, pluginManager: IPluginManager) {
        super(logger, pluginManager);
        PrinterPlugin.instance = this;
    }

    static getApp(): IPrintWeaveApp {
        return this.pluginManager.app;
    }

    static getInstance(): PrinterPlugin {
        if (!PrinterPlugin.instance) {
            throw new Error('PrinterPlugin not initialized');
        }
        return PrinterPlugin.instance;
    }

    getBambuWebsocketSubscriptionManager(): BambuWebsocketSubscriptionManager {
        return this.bambuWebsocketSubscriptionManager;
    }

    getConnectionManager(): ConnectionManager {
        return this.connectionManager;
    }

    initializeEvents(manager: IPluginManager): void {
        PrinterPlugin.logger.info('Initializing Bambu printer events');
    }

    buildPrinter(options: any): BasePrinter {
        const {ip, code, serial}: { ip: string, code: string, serial: string } = options;

        if (!ip || !code || !serial) {
            throw new Error('IP, code, serial are required');
        }

        return  BambuPrinter.build({
            type: this.printerType,
            ip: ip,
            code: code,
            serial: serial
        })
    }

    getOptionsBuildPrinter(): any {
        return {
            ip: {
                type: 'string',
                required: true,
                description: 'IP address of the Bambu printer'
            },
            code: {
                type: 'string',
                required: true,
                description: 'Access code for the Bambu printer'
            },
            serial: {
                type: 'string',
                required: true,
                description: 'Serial number of the Bambu printer'
            }
        };
    }

    savePrinter(printer: BasePrinter): Promise<BasePrinter> {
        return printer.save();
    }

    registerRoutes(app: Express): void {
        PrinterPlugin.logger.info('Registering Bambu printer routes');

        // Example route registration
        app.use('/api/printer/:printerId/bambu', async (req, res, next) =>{
            const printerId = parseInt(req.params.printerId);

            if (isNaN(printerId)) {
                res.status(400).json({ code: 400, message: 'Invalid printer ID' });
                next();
            }

            const printer = await PrinterPlugin.getApp().getPrinter(printerId)
            bambuPrinterRoutes(printerId,printer)(req, res, next);
        });
    }
}
