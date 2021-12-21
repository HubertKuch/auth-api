import express from 'express';
import { connect } from 'mongoose';
import { config } from 'dotenv'
import helmet from 'helmet';
import errorController from "./controllers/error.controller";
import userRouter from "./routes/user.router";
import logger from "./utils/logger";
import rateLimit from 'express-rate-limit';

config();

const app = express();
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

if (process.env.NODE_ENV === 'production') {
    app.use('/api', rateLimit({
        max: 150,
        windowMs: 60 * 60 * 1000,
        message: 'Too many request. Try again in an one hour.'
    }));
}

app.use('/api/v1/users/', userRouter);

app.use(errorController);



let db = `${process.env.DB_URI}`
    .replace('<user>', process.env.DB_USER??'')
    .replace('<password>', process.env.DB_PASS??'');

connect(db, {});

export default app;
