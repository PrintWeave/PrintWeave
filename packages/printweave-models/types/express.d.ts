import {User} from "../dist/models/User";

declare global {
    namespace Express {
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface User extends User {}

        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface Request {
            user?: User;
        }
    }
}

export {};
