import {Request, Response, Router} from "express";
import {Optional} from "sequelize";
import {printerRoutes} from "./printer.route.js";
import {
    GetPrintersResponse,
    UnauthorizedError,
    CreatePrinterResponse,
    CreatePrinterError,
    CreateBambuPrinterError,
    RemovePrinterError,
    RemovePrinterResponse,
    GetPrintersError,
    SimpleUnauthorizedError,
    GetPrinterStatusesResponse,
    GetPrinterStatusesError,
    PrinterStatusData,
    PrinterStatus,
    StatusType,
    GetBuilderOptionsResponse,
} from "@printweave/api-types";
import {BasePrinter, getPrinterAndUser, IPrintWeaveApp, Printer, User, UserPrinter} from "@printweave/models";
import {logger, pluginManager, websocketsManager} from "../main.js";
import {PluginManager} from "../plugins/plugin.manager.js";

export function printersRoutes(): Router {
    const router = Router();

    const app: IPrintWeaveApp = PluginManager.getPluginManager().app;

    router.get('/', async (req: Request, res: Response) => {
        const user: User = req.user as User;
        if (!user) {
            res.status(401).json(new SimpleUnauthorizedError(401) as GetPrintersError);
            return
        }

        let printers = await user.$get('printers');

        res.json({
            user: user,
            printers: printers
        } as GetPrintersResponse);
    });

    router.post('/', async (req: Request, res: Response) => {
        const user: User = req.user as User;
        if (!user) {
            res.status(401).json(new SimpleUnauthorizedError(401));
            return
        }

        const {name, type}: { name: string, type: string } = req.body;

        if (!name || !type) {
            res.status(400).json({code: 400, message: 'Name and type are required'} as CreatePrinterError);
            return
        }

        if (await Printer.findOne({where: {name}})) {
            res.status(400).json({code: 400, message: 'Name must be unique'} as CreatePrinterError);
            return
        }

        // TODO: Migrate to the plugin system
        const plugin = pluginManager.getPlugin(type);

        if (!plugin) {
            res.status(400).json({code: 400, message: 'Invalid printer type'} as CreatePrinterError);
            return
        }

        let fullPrinter: BasePrinter = null;

        try {
            fullPrinter = plugin.buildPrinter(req.body[type]);
        } catch (error) {
            res.status(400).json({code: 400, message: error.message} as CreatePrinterError);
            return
        }

        if (!fullPrinter) {
            res.status(400).json({code: 400, message: 'Invalid printer type'} as CreatePrinterError);
            return
        }

        let printer = await Printer.create({
            name: name,
            type: type
        });

        fullPrinter.dataValues.printerId = printer.id;
        await fullPrinter.save();

        await user.$add('printer', printer, {
            through: {
                permission: 'admin'
            }
        });

        await UserPrinter.update({
            permission: 'admin'
        }, {
            where: {
                userId: user.id,
                printerId: printer.id
            }
        });

        res.json({message: 'Printer created', printer: printer} as CreatePrinterResponse);
    });

    // Route to get all printer type options for building printers
    router.get('/options', (req: Request, res: Response) => {
        // Get all registered plugins
        const plugins = pluginManager.getPlugins();
        // Build a map of printerType -> options
        const options = {};
        for (const plugin of plugins) {
            options[plugin.printerType] = plugin.getOptionsBuildPrinter();
        }
        res.json({ message: 'Builder options retrieved', options: options } as GetBuilderOptionsResponse);
    });

    router.get('/statuses', async (req: Request, res: Response) => {
        const user: User = req.user as User;
        if (!user) {
            res.status(401).json(new SimpleUnauthorizedError(401) as GetPrinterStatusesError);
            return
        }

        const printers = await user.$get('printers');
        if (!printers || printers.length === 0) {
            res.status(200).json({message: 'No printers found', printerStatuses: []} as GetPrinterStatusesResponse);
            return;
        }


        const printerStatuses = await Promise.all(printers.map(async (printer: Printer) => {
            const fullPrinter = await app.getFullPrinter(printer);
            return {
                printerId: printer.id,
                status: await app.getPrinterStatusFromCache(printer.id),
                statusType: fullPrinter ? fullPrinter.statusType : null,
                printer: printer
            }
        }));

        printerStatuses.forEach((status: {
            printerId: any
            status: PrinterStatus
            statusType: StatusType
            printer: Printer
        }) => {
            websocketsManager.sendMessagePrinter(status.printerId, 'printerStatus', {
                printerId: status.printerId,
                status: status.status,
                statusType: status.statusType,
                printer: status.printer
            } as PrinterStatusData);
        });

        Promise.all(printers.map(async (printer: Printer) => {
            try {
                const status = await app.getPrinterStatusCached(printer.id);
            } catch (error) {
                const fullPrinter = await app.getFullPrinter(printer);
                websocketsManager.sendMessage(user.id, 'printerStatus', {
                    printerId: printer.id,
                    status: null,
                    statusType: fullPrinter ? fullPrinter.statusType : null,
                    printer: printer
                });
            }
        })).then();

        res.status(200).json({message: 'Printer statuses retrieved', printerStatuses} as GetPrinterStatusesResponse);
    });

    router.delete('/:printerId', async (req: Request, res: Response) => {
        let printerIdStr = req.params['printerId'];

        const printerId = parseInt(printerIdStr);

        if (isNaN(printerId)) {
            res.status(400).json();
            return
        }

        const {user, userPrinter, error} = await getPrinterAndUser(printerId, req.user, ['admin']);

        if (error) {
            res.status(error.code).json(error.err);
            return;
        }

        if (userPrinter.permission !== 'admin') {
            res.status(403).json(new SimpleUnauthorizedError(403));
            return
        }

        const printer = await Printer.findByPk(printerId);

        if (!printer) {
            res.status(404).json({message: 'Printer not found', code: 404} as RemovePrinterError);
            return
        }

        await user.$remove('printer', printer);

        await printer.destroy();

        res.json({message: 'Printer removed', printer: printer} as RemovePrinterResponse);
    });

    router.use('/:printerId', (req, res, next) => {
        const {printerId} = req.params;

        if (isNaN(parseInt(printerId))) {
            next();
        }

        printerRoutes(parseInt(printerId))(req, res, next);
    });

    return router;
}
