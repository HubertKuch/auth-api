export default class AppError extends Error{
    public isOperationalError: boolean;
    public statusCode: number;
    public status: string;

    constructor(msg: string, code: number) {
        super(msg);
        this.isOperationalError = true;
        this.status = `${code}`.startsWith('4') ? 'fail' : 'error';
        this.statusCode = code;

        Error.captureStackTrace(this);
    }
}