import {Router} from "express";
import {
    Printer,
    PrinterTimeOutError,
    User,
    UserPrinter,
    Express as PrintWeaveExpress,
    getPrinterAndUser
} from "@printweave/models";
import {BambuPrinter} from "../bambu.printer.model.js";
import {
    SimpleUnauthorizedError, BambuMQTTMessageError,
    BambuMQTTMessageResponse, UnauthorizedError
} from "@printweave/api-types";
import {PrinterConnectionsBambu} from "connection/ConnectionManager.js";
import {CustomMessageCommand} from "connection/mqtt/CustomMessageCommand.js";

export function bambuPrinterRoutes(printerId: number, printer: Printer): Router {
    const router = Router();

    /**
     * Send a MQTT message to the printer
     * POST /api/printers/:printerId/bambu/mqtt
     * Response: {@link BambuMQTTMessageResponse} | {@link BambuMQTTMessageError}
     */
    router.post('/mqtt', async (req, res) => {
        const {user, userPrinter, error} = await getPrinterAndUser(printerId, req.user);

        if (error) {
            res.status(error.code).json(error.err);
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
