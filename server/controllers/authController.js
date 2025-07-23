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
      expiresIn: "7",
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
      expiresIn: "7",
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
