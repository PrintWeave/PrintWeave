import {Router} from "express";
import {UserPrinter} from "../models/userprinter.model.js";
import {Printer} from "../models/printer.model.js";
import {bambuPrinterRoutes} from "./printer/bambu.printer.route.js";
import User from "../models/user.model.js";
import {
    GetPrinterError,
    GetPrinterResponse,
    PrinterActionError,
    PrinterActionResponse, PrinterStatusError, PrinterStatusResponse, SimpleUnauthorizedError,
} from "@printweave/api-types";
import {PrinterTimeOutError} from "../models/printers/bambu.printer.model.js";

export function printerRoutes(printerId: number): Router {
    const router = Router();

    /**
     * Get printer by printerId
     * GET /api/printers/:printerId
     * Response: {@link GetPrinterResponse} | {@link GetPrinterError}
     */
    router.get('/', async (req, res) => {
        const user = req.user;
        if (!user) {
            res.status(401).json(new SimpleUnauthorizedError(401));
            return;
        }

        // get the user's printers by printerId
        const printer = (await user.$get('printers')).find(printer => printer.id === printerId);

        res.json({user, printer} as GetPrinterResponse);
    });

    router.get('/version', async (req, res) => {
        const user = req.user;
        if (!user) {
            res.status(401).json(new SimpleUnauthorizedError(401));
            return;
        }

        // get the user's printers by printerId
        const userPrinter = await UserPrinter.findOne({
            where: {
                userId: user.id,
                printerId: printerId,
                permission: ['admin', 'operate', 'view']
            }
        });

        if (!userPrinter) {
            res.status(403).json(new SimpleUnauthorizedError(403));
            return;
        }

        const printer = await Printer.findByPk(printerId);
        try {
            const result = await printer.getPrinter().then(printer => printer?.getVersion());

            res.json({user, printer, result});
        } catch (error) {
            res.status(500).json({message: 'Error', error: error.message});
        }
    });

    /**
     * Stop current print job
     * POST /api/printers/:printerId/stop
     * Response: {@link PrinterActionResponse} | {@link PrinterActionError}
     */
    router.post('/stop', async (req, res) => {
        const user = req.user;
        if (!user) {
            res.status(401).json(new SimpleUnauthorizedError(401));
            return;
        }

        // get the user's printers by printerId
        const userPrinter = await UserPrinter.findOne({
            where: {
                userId: user.id,
                printerId: printerId,
                permission: ['admin', 'operate', 'view']
            }
        });

        if (!userPrinter) {
            res.status(403).json(new SimpleUnauthorizedError(403));
            return;
        }

        const printer = await Printer.findByPk(printerId);

        try {
            const result = await printer.getPrinter().then(printer => printer?.stopPrint());

            res.json({user, printer, result});
        } catch (error) {
            res.status(500).json({message: 'Error', error: error.message, code: 500} as PrinterActionError);
        }
    });

    /**
     * Pause current print job
     * POST /api/printers/:printerId/pause
     * Response: {@link PrinterActionResponse} | {@link PrinterActionError}
     */
    router.post('/pause', async (req, res) => {
        const user = req.user;
        if (!user) {
            res.status(401).json(new SimpleUnauthorizedError(401));
            return;
        }

        // get the user's printers by printerId
        const userPrinter = await UserPrinter.findOne({
            where: {
                userId: user.id,
                printerId: printerId,
                permission: ['admin', 'operate', 'view']
            }
        });

        if (!userPrinter) {
            res.status(403).json(new SimpleUnauthorizedError(403));
            return;
        }

        const printer = await Printer.findByPk(printerId);

        try {
            const result = await printer.getPrinter().then(printer => printer?.pausePrint());

            res.json({user, printer, result});
        } catch (error) {
            res.status(500).json({message: 'Error', error: error.message, code: 500} as PrinterActionError);
        }
    });

    /**
     * Resume current print job
     * POST /api/printers/:printerId/resume
     * Response: {@link PrinterActionResponse} | {@link PrinterActionError}
     */
    router.post('/resume', async (req, res) => {
        const user: User | undefined = req.user
        if (!user) {
            res.status(401).json(new SimpleUnauthorizedError(401));
            return
        }

        // get the user's printers by printerId
        const userPrinter = await UserPrinter.findOne({
            where: {
                userId: user.id,
                printerId: printerId,
                permission: ['admin', 'operate', 'view']
            }
        });

        if (!userPrinter) {
            res.status(403).json(new SimpleUnauthorizedError(403));
            return;
        }

        const printer = await Printer.findByPk(printerId);

        try {
            const result = await printer.getPrinter().then(printer => printer?.resumePrint());

            res.json({user, printer, result} as PrinterActionResponse);
        } catch (error) {
            res.status(500).json({message: 'Error', error: error.message, code: 500} as PrinterActionError);
        }
    });

    router.get('/status', async (req, res) => {
        const user = req.user;
        if (!user) {
            res.status(401).json(new SimpleUnauthorizedError(401));
            return;
        }

        // get the user's printers by printerId
        const userPrinter = await UserPrinter.findOne({
            where: {
                userId: user.id,
                printerId: printerId,
                permission: ['admin', 'operate', 'view']
            }
        });

        if (!userPrinter) {
            res.status(403).json(new SimpleUnauthorizedError(403));
            return;
        }

        const printer = await Printer.findByPk(printerId);

        try {
            const status = await printer.getPrinter().then(printer => printer?.getStatus());

            res.json({user, printer, status} as PrinterStatusResponse);
        } catch (error) {

            if (error instanceof PrinterTimeOutError) {
                res.status(408).json({message: 'timeout', code: 408} as PrinterStatusError);
                return;
            }

            res.status(500).json({message: 'Error', error: error.message, code: 500} as PrinterStatusError);
        }
    });

    router.use('/bambu', async (req, res, next) => {
        const printer = await Printer.findByPk(printerId);
        if (printer?.type !== 'bambu') {
            res.status(404).json({message: 'Not Found'});
            return;
        }

        bambuPrinterRoutes(printerId, printer)(req, res, next);
    });

    return router;
}
