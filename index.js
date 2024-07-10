const express = require("express");
const nm = require("nodemailer");
const cors = require("cors");
const fs = require("fs");
const ejs = require("ejs");
const path = require("path");

const { inject } = require("@vercel/analytics")

const calculate = require("./calculations");

require("dotenv").config();

const app = express();
const port = process.env.PORT;

app.disable("x-powered-by");

const CORSoptions = {
  origin: [
    "https://emi-calculator-omega.vercel.app",
    "https://harshavkportfolio.netlify.app",
    "http://localhost:5173",
  ],
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

app.use(cors(CORSoptions));

app.use(express.json());

app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  console.log(`Request from IP: ${ip}`);

  next();
});

app.get("/", (req, res) => {
  res.send("<h1>hello world!</h1>");
});

app.use(favicon(path.join(__dirname, 'public', 'favicon.png')));

app.post("/calculate", (req, res) => {
  try {
    const response = calculate(req);
    res.status(200).json(response);
  } catch (err) {
    console.log(err)
    res.status(500).send(err.message);
  }
});

app.listen(port, () => {
  console.log(`I'm running on port ${port}`);
});

const transporter = nm.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MY_EMAIL,
    pass: process.env.APP_PASS,
  },
});

app.post("/contact", (req, res) => {
  const { contactName, contactEmail, message } = req.body;
  const tqUserFilePath = path.join(__dirname, "thankyou.html.ejs");

  let tqUserFile;

  try {
    tqUserFile = fs.readFileSync(tqUserFilePath, "utf-8");

    const mailOptionsSelf = {
      from: contactEmail,
      to: "kondapalliharshavardhanraju@gmail.com",
      subject: `Contact Form Submission from ${contactName}`,
      text: `Name: ${contactName}\nEmail: ${contactEmail}\n\nMessage:\n${message}`,
    };

    transporter.sendMail(mailOptionsSelf, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        res.status(500).send("Error sending email.");
      } else {
        console.log("Email sent:", info.response);
        res.status(200).send("Email sent successfully.");
      }
    });

    let tqUserFileDynamic = ejs.render(tqUserFile, req.body);

    const mailOptionsUser = {
      from: "kondapalliharshavardhanraju@gmail.com",
      to: contactEmail,
      subject: "from dev",
      html: tqUserFileDynamic,
    };

    transporter.sendMail(mailOptionsUser, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        res.status(500).send("Error sending email.");
      } else {
        console.log("Email sent:", info.response);
        res.status(200).send("Email sent successfully.");
      }
    });
  } catch (err) {
    console.log(err);
  }
});

inject()
