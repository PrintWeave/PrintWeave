import {Request, Response, Router} from "express";
// import {User} from "../models/user.model.js";
// import {Printer} from "../models/printer.model.js";
// import {BasePrinter, BasePrinterAttributes} from "../models/printers/base.printer.model.js";
// import {BambuPrinter} from "../models/printers/bambu.printer.model.js";
// import {Optional} from "sequelize";
// import {UserPrinter} from "../models/userprinter.model.js";
// import {printerRoutes} from "./printer.route.js";

export function printersRoutes(): Router {
    const router = Router();

    // router.get('/', async (req: Request, res: Response) => {
    //     const user: User | undefined = req.user
    //     if (!user) {
    //         res.status(401).json({message: 'Unauthorized'});
    //         return
    //     }

    //     let printers = await user.getPrinters();

    //     res.json({user: user, printers: printers});
    // });

    // router.post('/', async (req: Request, res: Response) => {
    //     const user: User | undefined = req.user
    //     if (!user) {
    //         res.status(401).json({message: 'Unauthorized'});
    //         return
    //     }

    //     const {name, type}: { name: string, type: string } = req.body;

    //     if (!name || !type) {
    //         res.status(400).json({message: 'Name and type are required'});
    //         return
    //     }

    //     if (await Printer.findOne({where: {name}})) {
    //         res.status(400).json({message: 'Name must be unique'});
    //     }

    //     let fullPrinter: BasePrinter<BasePrinterAttributes, Optional<BasePrinterAttributes, 'printerId'>> = null;

    //     switch (type) {
    //         case 'bambu':
    //             const {ip, code, amsVersion}: { ip: string, code: string, amsVersion: string } = req.body.bambu;
    //             if (!ip || !code || !amsVersion) {
    //                 res.status(400).json({message: 'IP, code, amsVersion are required'});
    //                 return
    //             }
    //             fullPrinter = await BambuPrinter.create({
    //                 type: type,
    //                 ip: ip,
    //                 code: code,
    //                 amsVersion: amsVersion,
    //             })
    //             break;
    //         default:
    //             res.status(400).json({message: 'Invalid printer type'});
    //             return
    //     }

    //     const printer = await Printer.create({
    //         name: name,
    //         type: type
    //     });


    //     fullPrinter.printerId = printer.id;
    //     await fullPrinter.save();

    //     await user.addPrinter(printer);

    //     await UserPrinter.update({
    //         permission: 'admin'
    //     }, {
    //         where: {
    //             userId: user.id,
    //             printerId: printer.id
    //         }
    //     });

    //     res.json({message: 'Printer created', printer: printer});
    // });

    // router.delete('/:printerId', async (req: Request, res: Response) => {
    //     const user: User | undefined = req.user
    //     if (!user) {
    //         res.status(401).json({message: 'Unauthorized'});
    //         return
    //     }

    //     const {printerId} = req.params;

    //     if (isNaN(parseInt(printerId))) {
    //         res.status(400).json({message: 'Invalid printer ID'});
    //         return
    //     }

    //     const userPrinter = await UserPrinter.findOne({
    //         where: {
    //             userId: user.id,
    //             printerId: parseInt(printerId),
    //             permission: 'admin'
    //         }
    //     });


    //     if (!userPrinter) {
    //         res.status(404).json({message: 'Printer not found'});
    //         return
    //     }

    //     if (userPrinter.permission !== 'admin') {
    //         res.status(403).json({message: 'Unauthorized'});
    //         return
    //     }

    //     const printer = await Printer.findByPk(printerId);

    //     if (!printer) {
    //         res.status(404).json({message: 'Printer not found'});
    //         return
    //     }

    //     await user.removePrinter(printer);

    //     await printer.destroy();

    //     res.json({message: 'Printer removed'});
    // });

    // router.use('/:printerId', (req, res, next) => {
    //     const { printerId } = req.params;

    //     if (isNaN(parseInt(printerId))) {
    //         next();
    //     }

    //     printerRoutes(parseInt(printerId))(req, res, next);
    // });

    return router;
}
