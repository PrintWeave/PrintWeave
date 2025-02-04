import {Request, Response, NextFunction, Application} from 'express';
import passport from 'passport';
import {Strategy as JwtStrategy, ExtractJwt, VerifiedCallback} from 'passport-jwt';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import {User} from '../models/user.model.js';
import {envInt} from "../environment.js";
import {Printer} from "../models/printer.model.js";
import {UnauthorizedError} from "@printweave/api-types";

interface JwtPayload {
    id: string;
    username: string;
}

// Configuration
const JWT_SECRET = process.env.SECRET_KEY || 'your_secure_secret_key';

// JWT Strategy Configuration
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET
};


passport.use(new JwtStrategy(jwtOptions, async (payload: JwtPayload, done: VerifiedCallback) => {
    try {
        const user = await User.findByPk(payload.id);
        if (user) {
            return done(null, user);
        }
        return done(null, false);
    } catch (error) {
        return done(error, false);
    }
}));

// Authentication Middleware
const authMiddleware = function (req, res, next) {
    passport.authenticate('jwt', {session: false},
        (err, user, info) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(401).json(new SimpleUnauthorizedError(401));
            }
            // Forward user information to the next middleware
            req.user = user;
            next();
        })(req, res, next);
};
// Rate Limiter
const loginLimiter = rateLimit({
    windowMs: envInt("SERVER_LOGIN_WINDOW", 15 * 60 * 1000),
    limit: envInt("SERVER_LOGIN_ATTEMPTS", 5),
});

// Auth Routes
const authRoutes = (app: Application) => {
    // Register Route
    app.post('/register', async (req: Request, res: Response): Promise<void> => {
        try {
            const {username, password, email}: { username: string, password: string, email: string } = req.body;

            if (!username || !password || !email) {
                res.status(400).json({message: 'Username, password and email are required'});
                return
            }

            const user = await User.findOne({where: {username}});

            if (user) {
                res.status(400).json({message: 'User already exists'});
                return
            }

            const newUser = User.build({
                username: username,
                password: password,
                email: email,
                role: 'user',
                active: true,
            });

            await newUser.save();

            res.json({message: 'User created successfully'});
        } catch (error) {
            res.status(500).json({
                message: 'Registration failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            console.error(error)
        }
    });

    // Login Route
    app.post('/login', loginLimiter, async (req: Request, res: Response): Promise<void> => {
        try {
            const {username, password}: { username: string, password: string } = req.body;

            if (!username || !password) {
                res.status(400).json({message: 'Username and password are required'});
                return
            }

            const user = await User.findOne({where: {username}});

            if (!user) {
                res.status(401).json({message: 'Authentication failed'});
                return
            }

            const isMatch = await user.validatePassword(password);

            if (!isMatch) {
                res.status(401).json({message: 'Authentication failed'});
                return
            }

            const payload: JwtPayload = {
                id: user.id.toString(),
                username: user.username
            };

            const token = jwt.sign(payload, JWT_SECRET, {
                expiresIn: '7d'
            });

            res.json({
                message: 'Authentication successful',
                token: `Bearer ${token}`,
                raw: token
            });
        } catch (error) {
            res.status(500).json({
                message: 'Login failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            console.error(error)
        }
    });
};

export {authRoutes, authMiddleware};
