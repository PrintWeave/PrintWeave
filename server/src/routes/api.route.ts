import {Application, Router} from "express";
import {authMiddleware} from "./auth.route";
import {printersRoutes} from "./printers.route";

export function apiRoutes (): Router {
    const router = Router();

    router.use(authMiddleware)
    router.use('/printer', printersRoutes());

    return router;
}
