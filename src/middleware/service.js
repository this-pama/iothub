const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'adedapopaul@gmail.com',
    pass: 'moronkeji'
  }
});


export const sendMail= (sender, receiver, subject, message) => {
    var mailOptions = {
        from: sender,
        to: receiver,
        subject: subject,
        html: message
      }

     return transporter.sendMail(mailOptions)
}


export const mailSender = async (receiver,title,text, html ) => {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass // generated ethereal password
        }
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Arte Red" <no-reply@artered.com>', // sender address
        to: receiver, // list of receivers
        subject: title, // Subject line
        text: text, // plain text body
        html: html // html body
    });

    return 
}

