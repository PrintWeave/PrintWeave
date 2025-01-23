import {Application, Router} from "express";
import {authMiddleware} from "./auth.route";
import {printerRoutes} from "./printer.route";

export function apiRoutes (): Router {
    const router = Router();

    router.use(authMiddleware)
    router.use('/printer', printerRoutes());

    return router;
}
