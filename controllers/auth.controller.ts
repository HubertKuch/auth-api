import { Response, Request, NextFunction } from 'express';
import User from "../models/user.model";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import sendStatus from "../utils/sendStatus";
import sendEmail from "../utils/sendEmail";
import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import signToken from '../utils/signToken';
import { promisify } from 'util';

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

    const token: string = await signToken(user._id);

    sendStatus(res, 'success', 201, 'ok', { token });
});

const verifyEmail = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id, token } = req.params;

    if (!id || !token) {
        return sendStatus(res, 'Something went wrong. Open link again and check.', 400, 'fail');
    }

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

    // TODO THIS ACTION!!!
    if (user.twoAuth) {
        let loginToken: number = await user.generateTwoAuthToken();
        await user.save({ validateBeforeSave: false });
        await sendEmail({
            message: `Your activation code is here ${loginToken}`,
            subject: 'Activation code',
            to: 'kuchhhubert@gmail.com'
        });

        return sendStatus(res,
            'On your account was activated two factor authentication.' +
            'You must provide six numbers sent to your email.',
            200,
            'ok'
        );
    }

    const token = await signToken(user._id);

    sendStatus(res, 'success', 200, 'ok', { token });
});

const restrictTo = function (restrictedRoles: string) {
    const roles: Array<string> = restrictedRoles.split(' ');
    return (req: Request, res: Response, next: NextFunction) => {
        // @ts-ignore
        if (!roles.includes(req.user.role)) {
            next(new AppError('You don\'t permission to perform this action.', 403));
        }
        next();
    }
};

const protectRoute = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let token: string = '';

    if (req.headers.authorization && `${req.headers.authorization}`.startsWith('Bearer')) {
        token! = req.headers.authorization?.split(' ')[1];
    }

    if (token === '') {
        return next(new AppError('The token was not sent correct or you are not logged in.', 400));
    }

    // @ts-ignore
    const decodedData = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Check if user with this id still exists
    // @ts-ignore
    const user = await User.findById(decodedData.id);

    if (!user) {
        return next(new AppError('User with this id does not exists. Log in again.', 401));
    }

    // check if user was changed password after token was created
    // @ts-ignore
    if (user.afterPasswordChanged(token.iat)) {
        return next(new AppError('Password was changed after login. Please login again.', 401));
    }

    // @ts-ignore
    req.user = user;
    next();
});

const twoFactorAuth = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id, token }= req.params;

    if (!id || !token || `${token}`.length < 6) {
        return sendStatus(res, 'Provide activation code from your email.', 400, 'fail');
    }

    const user = await User.findById(id);

    if (user.twoAuthLoginToken !== token && user.twoAuthLoginExpiresIn < Date.now() - 500) {
        return sendStatus(res, 'Your activation code was wrong or has expired.', 401, 'fail');
    }

    user.twoAuthLoginExpiresIn = undefined;
    user.twoAuthLoginToken = undefined;

    await user.save({ validateBeforeSave: false });

    const jwtToken: string = await signToken(user._id);
    return sendStatus(res, 'Success', 200, 'ok', { jwtToken });
})

export default { signup, verifyEmail, login, protectRoute, restrictTo, twoFactorAuth };
