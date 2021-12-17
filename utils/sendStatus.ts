import {Response} from "express";

export default function sendStatus (res: Response, message: string, statusCode: number, status: string, data: {} = {} ) {
    return res.status(statusCode).json({ message, statusCode, status, data });
}