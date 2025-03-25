/*
import {Router} from "express";
import UserPrinter from "../../models/userprinter.model.js";
import Printer from "../../models/printer.model.js";
import {BambuPrinter} from "../../../../bambu-printer/src/bambu.printer.model.js";
import {CustomMessageCommand} from "../../../../bambu-printer/src/connection/mqtt/CustomMessageCommand.js";
import {
    SimpleUnauthorizedError, BambuMQTTMessageError,
    BambuMQTTMessageResponse
} from "@printweave/api-types";
import {PrinterTimeOutError} from "../../models/base.printer.js";


export function bambuPrinterRoutes(printerId: number, printer: Printer): Router {
    const router = Router();

    /!**
     * Send a MQTT message to the printer
     * POST /api/printers/:printerId/bambu/mqtt
     * Response: {@link BambuMQTTMessageResponse} | {@link BambuMQTTMessageError}
     *!/
    router.post('/mqtt', async (req, res) => {
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

        const bambuPrinter = await printer.getPrinter();

        if (!bambuPrinter || !(bambuPrinter instanceof BambuPrinter)) {
            res.status(404).json({message: 'Printer not a Bambu printer', code: 404} as BambuMQTTMessageError);
            return;
        }

        let ConnectionManager: PrinterConnectionsBambu;

        try {
            ConnectionManager = await bambuPrinter.getConnection();
        } catch (error) {
            if (error instanceof PrinterTimeOutError) {
                res.json({user, printer, result: "timeout"} as BambuMQTTMessageResponse);
                return;
            } else {
                throw error;
            }
        }

        try {
            await ConnectionManager.mqtt.client.executeCommand(new CustomMessageCommand(req.body), false);
            res.json({user, printer, result: "requested"} as BambuMQTTMessageResponse);
        } catch (e) {
            res.status(500).json({
                user,
                printer,
                error: e.message,
                code: 500,
                message: "Error"
            } as BambuMQTTMessageError);
        }
    });

    return router;
}
*/
