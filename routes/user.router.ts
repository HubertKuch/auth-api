import { Router } from 'express';
import AppError from "../utils/appError";
import UserApi from "../api/user.api";
import authController from "../controllers/auth.controller";

const userRouter: Router  = Router();

userRouter
    .get('/', UserApi.getAllUsers);
    
userRouter
    .post('/signin', authController.signup)
    .post('/login', authController.login)
    .patch('/verifyEmail/:id/:token', authController.verifyEmail);

export default userRouter;
