import {Router} from "express";
import {UserPrinter} from "../models/userprinter.model.js";
import {Printer} from "../models/printer.model.js";
import { bambuPrinterRoutes } from "./printer/bambu.printer.route.js";

export function printerRoutes(printerId: number): Router {
    const router = Router();

    router.get('/', async (req, res) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({message: 'Unauthorized'});
            return;
        }

        // get the user's printers by printerId
        const printer = (await user.getPrinters()).find(printer => printer.id === printerId);

        res.json({user, printer});
    });

    router.get('/version', async (req, res) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({message: 'Unauthorized'});
            return;
        }

        // get the user's printers by printerId
        const userPrinter = await UserPrinter.findOne({where: {userId: user.id, printerId: printerId, permission:['admin', 'operate', 'view']}});

        if (!userPrinter) {
            res.status(403).json({message: 'Unauthorized'});
            return;
        }

        const printer = await  Printer.findByPk(printerId);
        const version = await printer.getPrinter().then(printer => printer?.getVersion());

        res.json({user, printer, version});
    });

    router.post('/stop', async (req, res) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({message: 'Unauthorized'});
            return;
        }

        // get the user's printers by printerId
        const userPrinter = await UserPrinter.findOne({where: {userId: user.id, printerId: printerId, permission:['admin', 'operate', 'view']}});

        if (!userPrinter) {
            res.status(403).json({message: 'Unauthorized'});
            return;
        }

        const printer = await  Printer.findByPk(printerId);
        const result = await printer.getPrinter().then(printer => printer?.stopPrint());

        res.json({user, printer, result});
    });

    router.post('/pause', async (req, res) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({message: 'Unauthorized'});
            return;
        }

        // get the user's printers by printerId
        const userPrinter = await UserPrinter.findOne({where: {userId: user.id, printerId: printerId, permission:['admin', 'operate', 'view']}});

        if (!userPrinter) {
            res.status(403).json({message: 'Unauthorized'});
            return;
        }

        const printer = await  Printer.findByPk(printerId);
        const result = await printer.getPrinter().then(printer => printer?.pausePrint());

        res.json({user, printer, result});
    });

    router.post('/resume', async (req, res) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({message: 'Unauthorized'});
            return;
        }

        // get the user's printers by printerId
        const userPrinter = await UserPrinter.findOne({where: {userId: user.id, printerId: printerId, permission:['admin', 'operate', 'view']}});

        if (!userPrinter) {
            res.status(403).json({message: 'Unauthorized'});
            return;
        }

        const printer = await  Printer.findByPk(printerId);
        const result = await printer.getPrinter().then(printer => printer?.resumePrint());

        res.json({user, printer, result});
    });

    router.use('/bambu', async (req, res, next) => {
        const printer = await  Printer.findByPk(printerId);
        if (printer?.type !== 'bambu') {
            res.status(404).json({message: 'Not Found'});
            return;
        }

        bambuPrinterRoutes(printerId, printer)(req, res, next);
    });

    return router;
}
