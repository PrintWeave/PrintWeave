import {Request, Response, Router} from "express";
import {User} from "../models/user.model.js";
import {Printer} from "../models/printer.model.js";
import {BasePrinter} from "../models/printers/base.printer.js";
import {BambuPrinter} from "../models/printers/bambu.printer.model.js";
import {Optional} from "sequelize";
import {UserPrinter} from "../models/userprinter.model.js";
import {printerRoutes} from "./printer.route.js";
import {
    GetPrintersResponse,
    UnauthorizedError,
    CreatePrinterResponse,
    CreatePrinterError,
    CreateBambuPrinterError, RemovePrinterError, RemovePrinterResponse, GetPrintersError, SimpleUnauthorizedError,
} from "@printweave/api-types";

export function printersRoutes(): Router {
    const router = Router();

    router.get('/', async (req: Request, res: Response) => {
        const user: User | undefined = req.user
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
        const user: User | undefined = req.user
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

        let fullPrinter: BasePrinter = null;

        switch (type) {
            case 'bambu':
                const {ip, code, serial}: { ip: string, code: string, serial: string } = req.body.bambu;
                if (!ip || !code || !serial) {
                    res.status(400).json({code: 400, message: 'IP, code, serial are required'} as CreatePrinterError);
                    return
                }
                fullPrinter = BambuPrinter.build({
                    type: type,
                    ip: ip,
                    code: code,
                    serial: serial
                })
                break;
            default:
                res.status(400).json({code: 400, message: 'Invalid printer type'} as CreatePrinterError);
                return
        }

        const printer = await Printer.create({
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

    router.delete('/:printerId', async (req: Request, res: Response) => {
        const user: User | undefined = req.user
        if (!user) {
            res.status(401).json(new SimpleUnauthorizedError(401));
            return
        }

        const {printerId} = req.params;

        if (isNaN(parseInt(printerId))) {
            res.status(400).json({code: 400, message: 'Invalid printer ID'} as RemovePrinterError);
            return
        }

        const userPrinter = await UserPrinter.findOne({
            where: {
                userId: user.id,
                printerId: parseInt(printerId),
                permission: 'admin'
            }
        });


        if (!userPrinter) {
            res.status(404).json({message: 'Printer not found', code: 404} as RemovePrinterError);
            return
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
