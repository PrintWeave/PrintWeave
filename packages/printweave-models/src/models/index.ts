import User from "./user.model.js";

export * from './base.printer.js';
export * from './printer.model.js';
export * from './user.model.js';
export * from './userprinter.model.js';
export * from './plugin.interface.js';
export * from './printweave.app.js';
export * from './websockets.model.js';

export {Express, Router} from "express";
import * as PrintWeaveExpress from "express";
import express from 'express';
export {PrintWeaveExpress, express};

declare global {
    namespace Express {
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface Request {
            user?: User;
        }
    }
}
