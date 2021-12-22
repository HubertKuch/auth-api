import { Response, Request, NextFunction } from 'express';
import AppError from "../utils/appError";

function sendDevelopmentError(err: any, res: Response){
    console.log(err.stack);
    return res.status(err.statusCode).json({
       message: err.message,
       stack: err.stack,
       statusCode: err.statusCode,
       status: err.status,
    });
}


function sendProductionError(err: any, res: Response) {
    if (err.isOperationalError) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            statusCode: err.statusCode,
        });
    } else {
        return res.status(500).json({
            statusCode: 500,
            status: 'error',
            message: 'Something went very wrong. Contact with us.'
        })
    }
}

const handleJWTError = () => new AppError('Something went wrong with your token. Try again.', 401);
const handleValidationError = () => new AppError('ds', 400);
// @ts-ignore
const handleCastError = (err: Error) => new AppError(`${err.path} is incorrect. Try again.`, 400);
// @ts-ignore
const handleDuplicateFieldsError = (err: Error) => new AppError(`Duplicate ${Object.keys(err.keyValue)[0]} field, use another.`, 400);

export default (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.name === 'JsonWebTokenError') err = handleJWTError();
    if (err.name === 'ValidationError') err = handleValidationError();
    if (err.name === 'CastError') err = handleCastError(err);
    if (err.code === 11000) err = handleDuplicateFieldsError(err);

    err.statusCode = err.statusCode ?? 500;
    err.name = err.name ?? 'serverError';
    err.status = err.status ?? 'error';

    if (process.env.NODE_ENV === 'development') sendDevelopmentError(err, res);
    else if (process.env.NODE_ENV === 'production') sendProductionError(err, res);
}
