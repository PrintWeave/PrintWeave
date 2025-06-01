import {getUser} from "@/helpers/api.ts";
import type {IUser} from "@printweave/api-types";

export async function isLoggedIn(): Promise<boolean> {
    if (!localStorage.getItem('auth_token')) {
        return false;
    }

    const user = await getUser();

    if (user.error || !user.data) {
        logout();
        return false;
    }

    loggedInUser = user.data;

    return true;
}

export function logout(): void {
    localStorage.removeItem('auth_token');
}

export let loggedInUser: IUser | null = null;
