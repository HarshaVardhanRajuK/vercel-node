const express = require("express");
const nm = require("nodemailer");
const cors = require("cors")
const fs = require('fs');
const ejs = require("ejs")

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json());

app.get("/", (req, res)=>{
    res.send("hello")
})

const transporter = nm.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.APP_PASS
    }
});

app.post("/contact",(req, res)=>{
    const { contactName, contactEmail, message } = req.body;
    let tqUserFile = fs.readFileSync("thankyou.html.ejs", "utf-8")

    try{
        const mailOptionsSelf = {
            from: contactEmail,
            to: 'kondapalliharshavardhanraju@gmail.com',
            subject: `Contact Form Submission from ${contactName}`,
            text: `Name: ${contactName}\nEmail: ${contactEmail}\n\nMessage:\n${message}`
        };

        transporter.sendMail(mailOptionsSelf, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                res.status(500).send('Error sending email.');
            } else {
                console.log('Email sent:', info.response);
                res.status(200).send('Email sent successfully.');
            }
        });

        let tqUserFileDynamic = ejs.render(tqUserFile, req.body);

        const mailOptionsUser = {
            from: "kondapalliharshavardhanraju@gmail.com",
            to: contactEmail,
            subject: "from dev",
            html: tqUserFileDynamic
        };

        transporter.sendMail(mailOptionsUser, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                res.status(500).send('Error sending email.');
            } else {
                console.log('Email sent:', info.response);
                res.status(200).send('Email sent successfully.');
            }
        });

    }
    catch(err){
        console.log(err)
    }

})

app.listen(port, ()=>{
    console.log(`I'm running on port ${port}`)
})