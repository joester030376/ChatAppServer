const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "First name is required."]
    },
    lastName: {
        type: String,
        required: [true, "Last name is required."]
    },
    avatar: {
        type: String,        
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        validator: function(email) {
            return String(email)
                .toLowerCase()
                .match('/^([a-zA-Z0-9_\-\.] +)@([a-zA-Z0-9_\-\.]');
        },
        message: (props) => `Email (${props.value}) is invalid!`
    },
    password: {
        type: String,
    },
    passwordChangedAt: {
        type: Date,
    },
    passwordResetToken: {
        type: String,
    },
    passwordResetExpires: {
        type: Date,
    },
    passwordConfirm: {
        type: String,
    },
    createdAt: {
       type: Date 
    },
    updatedAt: {
        type: Date
    },
    verified: {
        type: Boolean,
        default: false,
    },
    otp: {
        type: String,
    },
    otp_expiry_time: {
        type: Date,
    },
    socket_id: {
        type: String,
    },
    friends: [
        {
            type: mongoose.Schema.ObjectId,
            ref: "User"
        }
    ],
    status: {
        type: String,
        enum: ["Online", "Offline" ]
    }
});

userSchema.pre("save", async function(next) {  

    // Only run this function if OTP is actually modified    
    if(!this.isModified("otp")) return next();
   
    // Encrypt OTP
    this.otp = await bcrypt.hash(this.otp, 12);

    next();
});

userSchema.pre("save", async function(next) {
    // Only run this function if OTP is actually modified   
    if(!this.isModified("password")) return next();

    // Encrypt password
    this.password = await bcrypt.hash(this.password, 12);    

    next();
});

userSchema.methods.correctPassword = async function (
    candidatePassword,
    userPassword,
) {  
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.correctOTP = async function (
    candidateOTP,
    userOTP,
) {
    return await bcrypt.compare(candidateOTP, userOTP);
};

userSchema.methods.createPasswordResetToken = function () {
    
    const resetToken = crypto.randomBytes(32).toString("hex");

    this.passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

        this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

userSchema.methods.changedPasswordAfter = function (timestamp) {
    return timestamp < this.passwordChangedAt;
}

const User = new mongoose.model("User", userSchema);
module.exports = User;