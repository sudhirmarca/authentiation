import express from "express";
import { login, logout, register } from "../controllers/authController.js";

const authRouter = express.Router();


// ======== auth routing ===========
authRouter.post("/register", register); // register route
authRouter.post("/login", login);
authRouter.post("/logout", logout);

export default authRouter;
