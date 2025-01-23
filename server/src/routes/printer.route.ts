import {Application, Router, Response, Request} from "express";

export function printerRoutes (): Router  {
    const router = Router();

    router.get('/', (req: Request, res: Response) => {
        const user = req.user;
        // TODO: Implement printer list
        res.json({message: 'Printer list'});
    });

    return router;
}
