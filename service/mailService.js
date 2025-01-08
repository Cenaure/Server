const nodemailer = require('nodemailer');

class MailService {

    constructor(){
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            },
            tls: {
                ciphers:'SSLv3'
            }
        })
    }

    async sendActivationMail(to, link) {
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to, 
            subject: 'Активація акаунту на ' + process.env.API_URL,
            text: '',
            html: 
            `
            <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f4f4f4;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            background-color: #fff;
                            border-radius: 10px;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        }
                        h1 {
                            color: #333;
                        }
                        a {
                            color: #007bff;
                            text-decoration: none;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Для активації акаунту перейдіть по посиланню:</h1>
                        <a href="${link}">${link}</a>
                    </div>
                </body>
            </html>
        `
        })
    }

    async sendOrderConfirmation(to) {
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to, 
            subject: 'Замовлення на ' + process.env.API_URL,
            text: '',
            html: 
                `
                    <div>
                        <h1>Ваше замовлення прийнято</h1>
                    </div>
                `
        })
    }

    async sendPassword(to, link) {
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to, 
            subject: 'Зброс пароля',
            text: '',
            html: 
                `
                    <div>
                        <h2>Посилання для зміни пароля - <a href="${link}">${link}</a></h2>
                    </div>
                `
        })
    }
}

module.exports = new MailService(); 