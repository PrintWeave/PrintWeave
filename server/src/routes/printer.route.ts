import {Router} from "express";

export function printerRoutes(printerId: number): Router {
    const router = Router();

    router.get('/', async (req, res) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({message: 'Unauthorized'});
            return;
        }

        // get the user's printers by printerId
        const printer = await user.getPrinters({where: {id: printerId}});

        res.json({user, printer});
    });

    return router;
}
