import app from './app';
import writeLog from './utils/writeLog';

app.listen(process.env.PORT);

process.on('unhandledRejection', (reason, promise) => {
    console.log(`UNHANDLED REJECTION: ${JSON.stringify(promise)} REASON ${reason}`);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    writeLog(err);
    console.log(err);
    process.exit(1);
});
