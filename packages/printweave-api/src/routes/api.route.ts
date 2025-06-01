import {Application, Router} from "express";
import {authMiddleware} from "./auth.route.js";
import {printersRoutes} from "./printers.route.js";
import {userRoutes} from "./users.route.js";

export function apiRoutes (): Router {
    const router = Router();

    router.use(authMiddleware)
    router.use('/printer', printersRoutes());

    router.use('/users', userRoutes());

    return router;
}
