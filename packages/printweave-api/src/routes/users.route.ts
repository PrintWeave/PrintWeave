import {Request, Response, Application, Router} from 'express';
import { SimpleUnauthorizedError } from "@printweave/api-types";
import { User } from "@printweave/models";
import { authMiddleware } from "./auth.route.js";
import { logger } from "../main.js";

// User Routes
export function userRoutes(): Router {
    const router = Router();
    // Current User Route
    router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
        logger.info("Gallo")

        try {
            const user = req.user as User;

            if (!user) {
                res.status(401).json(new SimpleUnauthorizedError(401));
                return;
            }

            // Exclude password and sensitive fields
            const userData = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                active: user.active,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            };

            res.json(userData);
        } catch (error) {
            res.status(500).json({
                message: 'Failed to retrieve current user',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            logger.error(error)
        }
    });

    return router;
}
