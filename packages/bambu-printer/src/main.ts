import {BasePrinter, IPluginManager, Plugin, Express} from "@printweave/models";
import {BambuPrinter} from "./bambu.printer.model.js";
import {ModelStatic, ModelCtor} from "@printweave/models";
import {IPrintWeaveApp, Logger} from "@printweave/models";
import {bambuPrinterRoutes} from "./routes/bambu.printer.route.js";
import {BambuWebsocketSubscriptionManager} from "./websockets.manager.js";
import {ConnectionManager} from "./connection/ConnectionManager.js";

export default class PrinterPlugin extends Plugin {

    private bambuWebsocketSubscriptionManager = new BambuWebsocketSubscriptionManager();
    private connectionManager: ConnectionManager = new ConnectionManager(this);

    private static instance: PrinterPlugin;

    name = "BambuPrinter";

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

    private handlePrintStart(printData: any): void {
        PrinterPlugin.logger.info('Print started', printData);
    }

    private handlePrintStop(printId: string): void {
        PrinterPlugin.logger.info('Print stopped', printId);
    }

    createPrinter(options: any): BasePrinter {
        PrinterPlugin.logger.info('Creating Bambu printer with options', options);
        return undefined;
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
