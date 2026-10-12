export abstract class CommonError extends Error {
    code: number;
    constructor(message: string, code: number) {
        super(message);
        this.name = "CommonError";
        this.code = code;
    }
}
export class NotFoundError extends CommonError {
    constructor(message: string) {
        super(message, 404);
        this.name = "NotFoundError";
    }
}
