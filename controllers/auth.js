const jwt = require('jsonwebtoken');
const User = require('../models/user');
const filterObj = require('../utils/filterObj');
const otpGenerator = require('otp-generator');
const crypto = require('crypto');
const { promisify } = require('util');
const mailService = require('../services/mailer');
const otpEmailerHTMLOutput = require('../email_templates/otpEmailerHTMLOutput');
const resetPasswordEmailerHTMLOutput = require('../email_templates/resetPasswordEmailerHTMLOutput');

const signToken = (userId) => jwt.sign({userId}, process.env.JWT_SECRET);

// Signup -> register -> sendOTP -> verifyOTP

// https://api.tawk.com/auth/register

// Register new user
exports.register = async (req, res, next) => {
    const {firstName, lastName, email, password} = req.body;

    const filteredBody = filterObj(
        req.body, 
        "firstName", 
        "lastName",         
        "email",
        "password", 
    );

    console.log(req.body);

    // check if a verified user with given email exists or not
    const existing_user = await User.findOne({email: email});    

    if(existing_user && existing_user.verified) {
        res.status(400).json({
            status: "error",
            message: "Email is already in use. Please log in."            
        });
    }
    else if(existing_user) {                
        await User.findOneAndUpdate({email: email}, filteredBody, {new: true, validateModelOnly: true});
        req.userId = existing_user._id;        
        next();
    }  
    else {
        console.log("New user");

        // if user record is not available in DB
        const new_user = await User.create(filteredBody)

        // generate OTP and send email to user
        req.userId = new_user._id;
        next();   
    }          
}

exports.sendOTP = async (req, res, next) => {

    const {userId} = req;    

    const new_otp = otpGenerator.generate(6, { 
        lowerCaseAlphabets: false, 
        upperCaseAlphabets: false, 
        specialChars: false 
    });  
    
    const otp_expiry_time = Date.now() + 10*60*1000; // 10 minutes after OTP

    const user = await User.findByIdAndUpdate(userId, {   
        otp_expiry_time: otp_expiry_time,                            
    }); 

    user.otp = new_otp.toString();
   
    try {
        await user.save({new: true, validateModifiedOnly: true}); 
    }
    catch(err) {
        console.log("User did not save: ", err);
    }

    mailService.nodeEmailer({
        from: "joseph.varner@firehawkdigital.com",
        to: user.email,
        subject: "OTP for login for Text2Them",        
        html: otpEmailerHTMLOutput(new_otp),
    });

    res.status(200).json({
        status: "success",
        message: "OTP sent successfully"
    });
};

exports.verifyOTP = async (req, res, next) => {

    // verify OTP and update user record accordingly
    const {email, otp} = req.body;    

    const user = await User.findOne({
        email,
        otp_expiry_time: {$gt: Date.now()},
    });

    if(!user) {
        res.status(400).json({
            status: 'error',
            message: "Email is invalid or OTP has expired."
        });
    }

    if(!await user.correctOTP(otp.toString(), user.otp)) {
        res.status(400).json({
            status: "error",
            message: "OTP is incorrect"
        });
    }

    // OTP is correct
    user.verified = true;
    user.otp = 'undefined';
    
    await user.save({new: true, validateModelOnly: true});

    const token = signToken(user._id);

    res.status(200).json({
        status: "success",
        message: "OTP is verified successfully",
        token,
        user_id: user._id
    });
};

// Login authentication code
exports.login = async (req, res, next) => {

    const { email, password} = req.body;

    if(!email || !password) {
        res.status(400).json({
            status: "error",
            message: "Both email and password are required."
        })
    }

    const user = await User.findOne({email: email}).select("+password");

    if(!user || (!await user.correctPassword(password, user.password))) {
        res.status(400).json({
            status: "error",
            message: "Email or password is incorrect."
        });
    }
    else {
        const token = signToken(user._id);  
        
        console.log(user._id);

        res.status(200).json({
            status: "success",
            message: "Logged in successfully.",
            token, 
            user_id: user._id
        });
    }        
};

exports.protect = async (req, res, next) => {
    // 1) Getting a token (JWT) and check if it is actually there

    console.log(req.body);

    let token;

    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    else if(req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    else {
        res.status(400).json({
            status: "error",
            message: "You are not logged in. Please log in to get access."

        });

        return;
    }

    // 2) Verification of token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const this_user = await User.findById(decoded.userId);

    if(!this_user) {
        res.status(400).json({
            status: "error",
            message: "The user does not exist."
        });
    }

    // 4) check if user changed their password after token was issued. 

    if(this_user.changedPasswordAfter(decoded.iat)) {
        res.status(400).json({
            status: "error",
            message: "User recently updated password. Please log in again."
        });
    }

    req.user = this_user;
    next();

};

// Types of routes -> Protected (Only logged in users can access these), Unprotected

exports.forgotPassword = async (req, res, next) => {
    // 1 ) Get user email
    console.log(req.body);
    const user = await User.findOne({email: req.body.email});    

    if(!user) {
        res.status(400).json({
            status: "error",
            message: "There is no user with this email address."
        });
        return;
    }

    // 2 ) Generate a random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save();

    const resetURL = `http://localhost:3000/auth/new-password/?resetToken=${resetToken}`;

    try {

        // TODO => email to user with reset url
        mailService.nodeEmailer({
            from: "joseph.varner@firehawkdigital.com",
            to: user.email,
            subject: "Reset for login for Text2Them",        
            html: resetPasswordEmailerHTMLOutput(user.firstName ,resetURL), 
        });

        res.status(200).json({            
            status: "success",
            message: "Reset Password link sent to email",   
            resetToken         
        })
    }
    catch(error) {
        user.createPasswordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save({validateBeforeSave: false});

        res.status(500).json({
            status: "error",
            message: "There was an error sending the email. Please try again later."
        })
    }
};

exports.resetPassword = async (req, res, next) => {

    console.log(req.body.token);

    // 1) Get the user based on token
    const hashedToken = crypto.createHash("sha256").update(req.body.token).digest("hex");
  
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: {$gt: Date.now()},
    });   

    // 2) If token has expired or submission is out of time window
    if(!user) {
        res.status(400).json({
            status: "error",
            message: "Token is invalid or expired.",
        });

        return;
    }
    
    // 3) Update users password and set resetToken & exipry to undefined
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.createPasswordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    // 4) Log in the user and send new JWT
    
    // TODO => send an email to user informing about password
    const token = signToken(user._id);

    res.status(200).json({
        status: "success",
        message: "Password reset successfully.",
        token,
    });
};

