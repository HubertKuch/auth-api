import { sign } from 'jsonwebtoken';
import { Response } from 'express';

export default async function signToken (res: Response, id: string): Promise<string> {
    res.cookie('token', {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES!),
        secure: true,
        httpOnly: true,
    });

    return sign({id}, process.env.JWT_SECRET!, {expiresIn: process.env.JWT_EXPIRES!});
};
