import {Request, Response, Router} from "express";
import {User} from "../models/user.model";
import {Printer} from "../models/printer.model";
import {BasePrinter, BasePrinterAttributes} from "../models/printers/base.printer.model";
import {BambuPrinter} from "../models/printers/bambu.printer.model";
import {Optional} from "sequelize";
import {UserPrinter} from "../models/userprinter.model";

export function printerRoutes(): Router {
    const router = Router();

    router.get('/', async (req: Request, res: Response) => {
        const user: User | undefined = req.user
        if (!user) {
            res.status(401).json({message: 'Unauthorized'});
            return
        }

        let printers = await user.getPrinters();

        res.json({user: user, printers: printers});
    });

    router.post('/', async (req: Request, res: Response) => {
        const user: User | undefined = req.user
        if (!user) {
            res.status(401).json({message: 'Unauthorized'});
            return
        }

        const {name, type}: { name: string, type: string } = req.body;

        if (!name || !type) {
            res.status(400).json({message: 'Name and type are required'});
            return
        }

        if (await Printer.findOne({where: {name}})) {
            res.status(400).json({message: 'Name must be unique'});
        }

        let fullPrinter: BasePrinter<BasePrinterAttributes, Optional<BasePrinterAttributes, 'printerId'>> = null;

        switch (type) {
            case 'bambu':
                const {ip, code, amsVersion}: { ip: string, code: string, amsVersion: string } = req.body.bambu;
                if (!ip || !code || !amsVersion) {
                    res.status(400).json({message: 'IP, code, amsVersion are required'});
                    return
                }
                fullPrinter = await BambuPrinter.create({
                    type: type,
                    ip: ip,
                    code: code,
                    amsVersion: amsVersion,
                })
                break;
            default:
                res.status(400).json({message: 'Invalid printer type'});
                return
        }

        const printer = await Printer.create({
            name: name,
            type: type
        });


        fullPrinter.printerId = printer.id;
        await fullPrinter.save();

        await user.addPrinter(printer);

        await UserPrinter.update({
            permission: 'admin'
        }, {
            where: {
                userId: user.id,
                printerId: printer.id
            }
        });

        res.json({message: 'Printer created', printer: printer});
    });

    return router;
}
