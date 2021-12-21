import { Request, Response, NextFunction } from 'express';

export default function (req: Request, res: Response, next: NextFunction) {
    const date = new Date(Date.now());
    console.log(`${date.toISOString()} | ${req.method} | ${req.url} | ${req.ip}`);
    next();
}