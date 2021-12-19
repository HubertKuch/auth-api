import { sign } from 'jsonwebtoken';

export default async function signToken (id: string): Promise<string> {
    const token: string = sign({  id }, process.env.JWT_SECRET!, { expiresIn: process.env.JWT_EXPIRES! })
    return token;
};
