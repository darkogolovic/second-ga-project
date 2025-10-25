const express = require("express");
const User = require("../models/user.js");
const nodemailer = require("nodemailer");
const bcrypt = require('bcrypt')

const router = express.Router();


// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", 
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.get("/register", (req, res) => {
  res.render("register.ejs", {
    error: null,
  });
});

router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const exists = await User.findOne({ email });
    if (exists)
      return res.render("register.ejs", { error: "Email already in use" });

    const code = generateCode();

    const user = new User({
      name,
      email,
      password, 
      role,
      verificationCode: code,
      codeExpires: new Date(Date.now() + 10 * 60 * 1000),
      isVerified: false,
    });

    await user.save();


    await transporter.sendMail({
      from: `"Piljara" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Verify your account",
      html: `
        <p>Hello ${user.name},</p>
        <p>Your verification code is:</p>
        <h2>${code}</h2>
        <p>It will expire in 10 minutes.</p>
      `,
    });

    res.render("verify.ejs", { email: user.email, error: null });
  } catch (err) {
    console.error(err);
    res.render("register.ejs", { error: "Something went wrong" });
  }
});

router.get("/verify", (req, res) => {
  res.render("verify.ejs", { error: null, email: "" });
});


router.get("/verify", (req, res) => {
  res.render("verify.ejs", { error: null, email: "" });
});

router.post("/verify", async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.render("verify.ejs", { error: "User not found", email });

    if (user.isVerified) return res.send("Already verified!");

    if (user.verificationCode !== code || user.codeExpires < new Date()) {
      return res.render("verify.ejs", { error: "Invalid or expired code", email });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.codeExpires = undefined;
    await user.save();

    res.send("Email verified! You can now <a href='/login'>login</a>.");
  } catch (err) {
    console.error(err);
    res.render("verify.ejs", { error: "Something went wrong", email });
  }
});

router.get("/resend/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.send("User not found");

    if (user.isVerified) return res.send("Your account is already verified!");

    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = code;
    user.codeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minuta
    await user.save();

    
    await transporter.sendMail({
      from: `"Fruit Store" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Your new verification code",
      html: `
        <p>Hello ${user.name},</p>
        <p>Your new verification code is:</p>
        <h2>${code}</h2>
        <p>It will expire in 10 minutes.</p>
      `
    });

    res.redirect(`/verify?email=${encodeURIComponent(email)}&msg=New code sent! Check your email.`);
  } catch (err) {
    console.error(err);
    res.redirect(`/verify?email=${encodeURIComponent(email)}&msg=Something went wrong`);
  }
});

router.get('/login',(req,res)=>{
  if(req.session.user) res.redirect('/')
  res.render('login.ejs',{
    error : null
  })
})

router.post('/login',async (req,res)=>{
  try{
    const {email,password}= req.body;
    const user = await User.findOne({email});
    if(!user) {
      return res.render('login.ejs',{error: 'User not found' })
    }
    if(!user.isVerified){
      return res.render('login.ejs',{error: 'User is not verified'})
    }

    const isMatch = await bcrypt.compare(password,user.password);

    if(!isMatch){
      return res.render('login.ejs',{
        error: 'Password inccorect'
      })
    }

    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

   return res.redirect('/')

  }catch(error){
    console.error(error)

    return res.render('login.ejs',{

      error:'Something went wrong.'
    })
  }
})

router.get('/logout',(req,res)=>{
  req.session.destroy((error)=>{
    if(error){
      return res.redirect('/')
    }
    res.clearCookie('connect.sid');
    res.redirect('/login')
  })
})

module.exports = router;
