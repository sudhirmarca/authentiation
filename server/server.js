import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";

const app = express();
const PORT = process.env.PORT || 8000;

// Default middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true }));

// database connection
connectDB()



// router
app.get('/', (req, res)=>{
    res.send('Hello World')
})

// express app listen
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
