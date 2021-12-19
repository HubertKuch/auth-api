import { Response, Request, NextFunction } from 'express';
import User from "../models/user.model";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import sendStatus from "../utils/sendStatus";
import sendEmail from "../utils/sendEmail";
import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import signToken from '../utils/signToken';
import { isValidObjectId } from 'mongoose';

interface ISingUpData {
    username: string,
    password: string,
    passwordConfirm: string,
    email: string,
    photo?: string,
}

const signup = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { username, passwordConfirm, password, photo, email }: ISingUpData = req.body;

    if (!username || !email || !password || !passwordConfirm) {
        return next(new AppError('Please provide all of your data and try again.',400));
    }

    const user = new User({
        email,
        username,
        password,
        passwordConfirm,
        photo,
    });

    const verificationToken = await user.generateActivationEmailToken();
    const verifyEmailURL = `${req.protocol}://${req.hostname}${req.baseUrl}/verifyEmail/${user._id}/${verificationToken}`;
    await user.save();
    await sendEmail({
        message: `Verify your email at ${verifyEmailURL}`,
        subject: 'Verify email',
        to: 'kuchhhubert@gmail.com'
    });

    sendStatus(res, 'success', 201, 'ok', { user });
});

const verifyEmail = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id, token } = req.params;
    const user = await User.findById(id);
    const hashedToken = createHash('sha256').update(token).digest('hex');

    if (!user) {
        return next(new AppError('Invalid user id.', 401));
    }

    if (hashedToken === user.activateEmailToken && (user.activateEmailTokenExpiresIn > Date.now()-5)){
        user.isEmailActivated = true;
        user.activateEmailToken = undefined;
        user.activateEmailTokenExpiresIn = undefined;
        await user.save({ validateBeforeSave: false });

        return sendStatus(res, 'Your account was activated.' ,200, 'ok', { user });
    }
});

const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password }: { email: string, password: string } = req.body;
    if (!email || !password) {
        return next(new AppError('Please provide email and password.', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!await user) {
        return next(new AppError('Email or password was incorrect.', 401));
    }

    //  compare hash
    if (!user.comparePassword(password)) {
        return next(new AppError('Email or password was incorrect.', 401));
    }

    // check if email is active
    if (!user.isEmailActivated) {
        return next(new AppError('Your email was not activated', 401));
    }

    // check if user account was not deleted
    if (!user.isActivated) {
        return next(new AppError('Your account was deleted', 401));
    }

    const token = await signToken(user._id);

    sendStatus(res, 'success', 200, 'ok', { token });
});

interface IUserReq extends Request {
    user: any
}

const protectRoute = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let token: string = '';

    if (req.headers.authorization && `${req.headers.authorization}`.startsWith('Bearer')) {
        token! = req.headers.authorization?.split(' ')[1];
    }

    if (token === '') {
        return next(new AppError('The token was not sent corrct.', 400));
    }

    const userId = jwt.verify(token, process.env.JWT_SECRET!);
});

export default { signup, verifyEmail, login, protectRoute };
