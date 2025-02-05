import {Router, Response as EResponse} from "express";
import {UserPrinter} from "../models/userprinter.model.js";
import {Printer} from "../models/printer.model.js";
import {bambuPrinterRoutes} from "./printer/bambu.printer.route.js";
import User from "../models/user.model.js";
import {
    GetPrinterError,
    GetPrinterResponse, Invalid3mfFileError,
    PrinterActionError,
    PrinterActionResponse,
    PrinterStatusError,
    PrinterStatusResponse,
    PrintFileReport,
    SimpleUnauthorizedError,
    UploadFileError,
} from "@printweave/api-types";
import {PrinterTimeOutError} from "../models/printers/bambu.printer.model.js";
import {storage} from "../app.js";
import {BlobReader, BlobWriter, TextWriter, ZipReader} from "@zip.js/zip.js";
import {promises as fs} from "fs";
import {XMLParser} from "fast-xml-parser";
import {BasePrinter} from "../models/printers/base.printer.js";
import {Readable} from "node:stream";

const analyze3mfFile = async (file: Express.Multer.File, res: EResponse<any, Record<string, any>>): Promise<PrintFileReport> => {
    let result = {} as PrintFileReport;


    const fileData = await fs.readFile(file.path);
    const blob = new Blob([fileData]);

    const zip = new ZipReader(new BlobReader(blob));

    // check if zip has a folder Metadata
    const entries = await zip.getEntries();
    const metadata = entries.find(entry => entry.filename === 'Metadata/model_settings.config');

    if (!metadata) {
        res.status(400).json({message: 'Invalid 3mf file', code: 400} as Invalid3mfFileError);
        return null;
    }

    const metadataStream = new TransformStream();
    const metadataPromise = new Response(metadataStream.readable).text();
    await metadata.getData(metadataStream.writable);

    const parser = new XMLParser({
        ignoreAttributes: false,
        parseAttributeValue: true
    });
    const metadataJson = parser.parse(await metadataPromise);

    let metadataPlates = metadataJson.config.plate;

    if (!Array.isArray(metadataPlates)) {
        metadataPlates = [metadataPlates];
    }

    result.plates = await Promise.all(metadataPlates.map(async (plate: any) => {
        const thumbnailPath = plate.metadata.find((metadata: any) => metadata["@_key"] === 'thumbnail_file')['@_value'];

        console.log(thumbnailPath);

        const thumbnailEntry = entries.find(entry => entry.filename === thumbnailPath);
        let thumbnail: Blob = null;

        console.log(thumbnailEntry);

        if (thumbnailEntry) {
            const thumbnailStream = new TransformStream();
            const thumbnailPromise = new Response(thumbnailStream.readable).bytes()
            await thumbnailEntry.getData(thumbnailStream.writable);

            console.log(thumbnailPromise);

            thumbnail = new Blob([new Uint8Array(await thumbnailPromise)]);
        }



        return {
            hasGcode: plate.metadata.some((metadata: any) => metadata["@_key"] === 'gcode_file' && metadata['@_value'] !== ''),
            id: plate.metadata.find((metadata: any) => metadata["@_key"] === 'plater_id')['@_value'],
            name: plate.metadata.find((metadata: any) => metadata["@_key"] === 'plater_name')['@_value'],
            thumbnail: '',
            thumbnailRaw: thumbnail,
            internal: {
                gcodeFile: plate.metadata.find((metadata: any) => metadata["@_key"] === 'gcode_file')['@_value'],
                thumbnailFile: plate.metadata.find((metadata: any) => metadata["@_key"] === 'thumbnail_file')['@_value'],
                pickFile: plate.metadata.find((metadata: any) => metadata["@_key"] === 'pick_file')['@_value'],
                patternBBoxFile: plate.metadata.some((metadata: any) => metadata["@_key"] === 'pattern_bbox_file') ? plate.metadata.find((metadata: any) => metadata["@_key"] === 'pattern_bbox_file')['@_value'] : '',
                topFile: plate.metadata.find((metadata: any) => metadata["@_key"] === 'top_file')['@_value'],
                thumbnailNoLightFile: plate.metadata.find((metadata: any) => metadata["@_key"] === 'thumbnail_no_light_file')['@_value'],
            }
        }
    }));

    await zip.close();


    return result;
};

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

    /**
     * Get printer status
     * GET /api/printers/:printerId/status
     * Response: {@link PrinterStatusResponse} | {@link PrinterStatusError}
     */
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

    router.post('/file', storage.single('file'), async (req, res) => {
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
                permission: ['admin', 'operate']
            }
        });

        if (!userPrinter) {
            res.status(403).json(new SimpleUnauthorizedError(403));
            return;
        }

        if (!req.file) {
            res.status(400).json({message: 'File is required'});
            return;
        }

        let printFileReport: PrintFileReport | null = null;

        switch (req.file.originalname.split('.').pop()) {
            case 'gcode':
                break;
            case '3mf':
                printFileReport = await analyze3mfFile(req.file, res);
                if (!printFileReport) {
                    return;
                }

                break;
            default:
                res.status(400).json({message: 'Unsupported file type', code: 400} as UploadFileError);
                return;
        }

        const printer = await Printer.findByPk(printerId);

        if (!printer) {
            res.status(404).json({message: 'Printer not found'});
            return;
        }

        const typedPrinter: BasePrinter = await printer.getPrinter();

        const response = await typedPrinter.uploadFile(req.file, printFileReport);

        res.json({message: 'File uploaded', printFileReport, response});

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
