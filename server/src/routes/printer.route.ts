import {Application, Router, Response, Request} from "express";

export function printerRoutes (): Router  {
    const router = Router();

    router.get('/', (req: Request, res: Response) => {
        const user = req.user;
        res.json({message: 'Printer list', user});
    });

    return router;
}
