import {User as OwnUser} from "@printweave/models";

declare global {
    namespace Express {
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface User extends OwnUser {}

        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface Request {
            user?: OwnUser;
        }
    }
}

export {};
