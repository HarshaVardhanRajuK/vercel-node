const express = require("express");
const nm = require("nodemailer");
const cors = require("cors");
const fs = require("fs");
const ejs = require("ejs");
const path = require("path");
const redis = require("redis");

const { inject } = require("@vercel/analytics");

const calculate = require("./calculations");

require("dotenv").config();

const app = express();
const port = process.env.PORT;

app.disable("x-powered-by");

const redisClient = redis.createClient({
  password: process.env.REDIS_PASS,
  socket: {
    host: "redis-12304.c264.ap-south-1-1.ec2.redns.redis-cloud.com",
    port: 12304,
  },
});

redisClient
  .connect(console.log("redis connected!"))
  .catch((err) => console.error(err));

// redisClient.on('error', err=>console.error(err))
// redisClient.on('connect', ()=>console.log("redis connected!"))

// (async () => {
//   await redisClient.connect();
// })();

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

app.get("/", (req, res) => {
  res.send("<h1>hello world!</h1>");
});

app.get("/favicon.ico", (req, res) => res.status(204).end());

app.get("/favicon.png", (req, res) => res.status(204).end());

app.post("/calculate", async (req, res) => {
  try {
    const cacheKey = JSON.stringify(req.body)
    let data;

    if (redisClient.isReady) {
      data = await redisClient.get(cacheKey);
    }

    if (data){
      console.log("cache hit")
      return res.status(200).json(JSON.parse(data));
    }

    console.log("cache miss")
    data = calculate(req.body)
    if (redisClient.isReady){
      await redisClient.setEx(cacheKey, 259200, JSON.stringify(data))
    }
    return res.status(200).json(data)
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
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

app.listen(port, () => {
  console.log(`I'm running on port ${port}`);
});

inject();
