import { Response, Request, NextFunction } from 'express';
import catchAsync from "../utils/catchAsync";
import User from "../models/user.model";
import AppError from "../utils/appError";
import sendStatus from "../utils/sendStatus";

const getAllUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const users = await User.find({});

    sendStatus(res, 'success', 200, 'ok', { users });
})

export default {
    getAllUsers
};
