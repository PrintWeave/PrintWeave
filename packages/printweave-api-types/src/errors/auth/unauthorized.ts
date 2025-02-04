export interface UnauthorizedError {
    code: 401 | 403;
    message: "Unauthorized";
}

export class SimpleUnauthorizedError implements UnauthorizedError {
    code: 401 | 403;
    message: "Unauthorized";

    constructor(code: 401 | 403) {
        this.code = code;
    }

}

export const isUnauthorizedError = (value: any): value is UnauthorizedError => {
    return (value.code === 401 || value.code === 403) && value.message === "Unauthorized";
}
