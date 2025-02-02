import { Router } from "express";
import UserPrinter from "../../models/userprinter.model.js";
import Printer from "../../models/printer.model.js";
import BambuPrinter from "../../models/printers/bambu.printer.model.js";
import { ConnectionManager } from "../../connections/manager.connection.js";

export function bambuPrinterRoutes(printerId: number, printer: Printer): Router {
    const router = Router();

    router.post('/mqtt', async (req, res) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // get the user's printers by printerId
        const userPrinter = await UserPrinter.findOne({ where: { userId: user.id, printerId: printerId, permission: ['admin', 'operate'] } });

        if (!userPrinter) {
            res.status(403).json({ message: 'Unauthorized' });
            return;
        }

        const bambuPrinter = await printer.getPrinter();

        if (!bambuPrinter || !(bambuPrinter instanceof BambuPrinter)) {
            res.status(404).json({ message: 'Printer not a Bambu printer' });
            return;
        }

        const ConnectionManager = await bambuPrinter.getConnection();

        try {
            await ConnectionManager.mqtt.client.executeCommand(req.body, false);
            res.json({ user, printer, result: "success" });
        } catch (e) {
            res.status(500).json({ user, printer, error: e.message });
        }
    });

    return router;
}
