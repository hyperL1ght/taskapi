const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = async (email, name) => {
    sgMail.send({
        to: email,
        from: 'biminh0@gmail.com',
        subject: 'Welcome email',
        text: `Welcome to the app ${name}.`
    })
}
const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'biminh0@gmail.com',
        subject: 'Bye',
        text: `Bye ${name}.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}

