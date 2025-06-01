import {Request, Response, Application} from 'express';
import passport from 'passport';
import {Strategy as JwtStrategy, ExtractJwt, VerifiedCallback} from 'passport-jwt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import {envInt, envString} from "../environment.js";
import {SimpleUnauthorizedError} from "@printweave/api-types";
import {User} from "@printweave/models";
import dotenv from "dotenv";
import {logger} from "../main.js";

interface JwtPayload {
    id: string;
    username: string;
}

dotenv.config({path: './.env'});

// Configuration
const JWT_SECRET = envString("JWT_SECRET", "");

if (!JWT_SECRET || JWT_SECRET === "") {
    throw new Error("JWT_SECRET is not defined, please set it in your .env file");
}

// JWT Strategy Configuration
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET
};

passport.use(new JwtStrategy(jwtOptions, async (payload: JwtPayload, done: VerifiedCallback) => {
    try {
        const user: User = await User.findByPk(payload.id);
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
        (err, user) => {
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
            logger.error(error)
        }
    });

    // Login Route
    app.post('/login', loginLimiter, async (req: Request, res: Response): Promise<void> => {
        try {
            const {username, password, rememberMe = false}: { username: string, password: string, rememberMe?: boolean } = req.body;

            if (!username || !password) {
                res.status(400).json({message: 'Username and password are required'});
                return
            }

            const user = await User.findOne({where: {username: username}}) || await User.findOne({where: {email: username}});

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
                expiresIn: rememberMe ? '30d' : '1h' // 30 days if rememberMe is true, otherwise 1 hour
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
            logger.error(error)
        }
    });
};

export {authRoutes, authMiddleware};
