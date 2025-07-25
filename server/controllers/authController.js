import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import transporter from "../config/nodeMailer.js";

// register controller
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ message: "Please fill in all fields.", success: false });
  }
  try {
    //check if user exist or not
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ message: "Email already exists.", success: false });
    }
    // password encription
    const hashedPassword = await bcrypt.hash(password, 10);
    // create new user
    const user = new userModel({ name, email, password: hashedPassword });
    await user.save();

    // token generation
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // send email for verification
    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Verify your email",
      text: `welcome to the dev website, Your account has been created with email id " ${email}`,
    };
    await transporter.sendMail(mailOption);

    res.json({ msg: "User created successfully.", success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

//=========== user login ==================//

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ msg: "Email and password are required", success: false });
  }
  try {
    const user = await userModel.findOne({ email });
    // user exist of not
    if (!user) {
      return res.json({ success: false, message: "Invalid email" });
    }
    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    // marching password
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid password" });
    }
    // token generation
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// ======= logout controller ============= //

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json({ success: true, message: "logged out" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// ===== account verification OTP ========

export const sendVerifyOtp = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await userModel.findById(userId);
    if (user.isAccountVerified) {
      return res.json({ success: false, message: "Account already verified" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    // send email
    const mailOption = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Account Verification OTP",
      text: `Your OTP is ${otp}. verify your account using this OTP `,
    };

    await transporter.sendMail(mailOption);
    return res.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// ===== to verify account ===========

export const verifyEmail = async (req, res) => {
  const { otp } = req.body;
  const userId = req.userId;

  if (!userId || !otp) {
    return res.json({ success: false, message: "Invalid request" });
  }
  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    if (user.verifyOtp === "" || user.verifyOtp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }
    if (user.verifyOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP expired" });
    }

    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = 0;

    await user.save();
    return res.json({
      success: true,
      message: "Account verified successfully",
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// =========== isAuthenticated check user ========

export const isAuthenticated = async (req, res) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// ========== send password reset OTP =========

export const sendResetOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.json({ success: false, message: "Email is required" });
  }
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

    await user.save();

    // send email
    const mailOption = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Password Reset OTP",
      text: `Your OTP is resetting your password is ${otp}. Use this OTP to reset your password `,
    };

    await transporter.sendMail(mailOption);
    return res.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// ========== user verify OTP and Reset Password ========

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.json({
      success: false,
      message: "Email, OTP and password are required",
    });
  }
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    if (user.resetOtp === "" || user.resetOtp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }
    if (user.resetOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP expired" });
    }
    const hashedPasswrod = await bcrypt.hash(newPassword, 10);
    user.password = hashedPasswrod;
    user.resetOtp = "";
    user.resetOtpExpireAt = "";
    await user.save();

    return res.json({success : true, message : "password has been reset sucessfully!"})

  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
