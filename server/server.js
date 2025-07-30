import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import authRoutes from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";

const app = express();
const PORT = process.env.PORT || 8000;
// database connection
connectDB();

const allowedOrigins = ['http://localhost:5173']

// Default middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin : allowedOrigins, credentials: true }));



// API END POINTS
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRouter);

// express app listen
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
