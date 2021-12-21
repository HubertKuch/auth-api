import { Response, Request, NextFunction } from 'express';

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
    console.log(err);
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

export default (err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode ?? 500;
    err.name = err.name ?? 'serverError';
    err.status = err.status ?? 'error';

    switch (process.env.NODE_ENV) {
        case 'development':
            sendDevelopmentError(err, res);
            break;
        case 'production':
            sendProductionError(err, res);
            break;
    }
}
