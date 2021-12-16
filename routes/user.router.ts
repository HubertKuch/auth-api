import { Router } from 'express';
import AppError from "../utils/appError";

const userRouter: Router  = Router();

userRouter
    .get('/', (req, res, next) => {
        return next(new AppError('test', 401));
    })

export default userRouter;
