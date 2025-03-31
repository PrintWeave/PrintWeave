import {SimpleUnauthorizedError, UnauthorizedError} from "@printweave/api-types";
import {User, UserPrinter} from "../models/index.js";

/**
 * Get the user and user printer by printerId
 * @param printerId - the printerId to get the user printer for
 * @param user - the user to get the user printer for (example: req.user)
 * @param permission - the permissions allowed for the user printer (default: ['admin', 'operate'])
 */
export async function getPrinterAndUser(printerId: number, user: User | any, permission?: string[]): Promise<{
    user: User | null,
    userPrinter: UserPrinter | null,
    error: { err: UnauthorizedError, code: number } | null
}> {
    if (!user) {
        return {user, userPrinter: null, error: {err: new SimpleUnauthorizedError(401), code: 401}};
    }

    const castedUser: User = user as User;
    if (!castedUser.id) {
        return {user, userPrinter: null, error: {err: new SimpleUnauthorizedError(401), code: 401}};
    }

    // get the user's printers by printerId
    const userPrinter = await UserPrinter.findOne({
        where: {
            userId: castedUser.id,
            printerId: printerId,
            permission: permission || ['admin', 'operate']
        }
    });

    if (!userPrinter) {
        return {user: castedUser, userPrinter, error: {err: new SimpleUnauthorizedError(403), code: 403}};
    }

    return {user, userPrinter: userPrinter, error: null};
}
