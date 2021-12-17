import nodemailer from 'nodemailer';

interface IMailOptions {
    to: string,
    subject: string,
    message: string,
    html?: string
}

export default async function sendEmail (options: IMailOptions ) {
    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: 'remington.jacobson34@ethereal.email',
            pass: 'nEnm1V4SMNdsdBzzPe'
        }
    });

    const { to, subject, message, html } = options;
    return await transporter.sendMail({
        from: 'test',
        to,
        subject,
        text: message,
        html: html??'',
    });
}
