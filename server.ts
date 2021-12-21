import app from './app';
import writeLog from './utils/writeLog';

app.listen(process.env.PORT, () => console.log(`server listen on ${process.env.PORT} | ${process.env.NODE_ENV} SERVER`));

process.on('unhandledRejection', (reason, promise) => {
    console.log(`UNHANDLED REJECTION: ${JSON.stringify(promise)} REASON ${reason}`);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    writeLog(err);
    console.log(err);
    process.exit(1);
});
