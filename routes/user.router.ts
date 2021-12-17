import { Router } from 'express';
import AppError from "../utils/appError";
import UserApi from "../api/user.api";
import authController from "../controllers/auth.controller";

const userRouter: Router  = Router();

userRouter
    .get('/', UserApi.getAllUsers)
    .post('/', authController.signup);

userRouter
    .patch('/verifyEmail/:id/:token', authController.verifyEmail);

export default userRouter;
