import { Response, Request, NextFunction } from 'express';
import User from "../models/user.model";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import sendStatus from "../utils/sendStatus";
import sendEmail from "../utils/sendEmail";
import { createHash } from 'crypto';

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
    console.log(222)
    if (hashedToken === user.activateEmailToken && (user.activateEmailTokenExpiresIn > Date.now()-5)){
        user.isEmailActivated = true;
        user.activateEmailToken = undefined;
        user.activateEmailTokenExpiresIn = undefined;
        await user.save({ validateBeforeSave: false });

        return sendStatus(res, 'Your account was activated.' ,200, 'ok', { user });
    }
});

export default { signup, verifyEmail };
