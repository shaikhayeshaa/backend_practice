import 'dotenv/config';
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectDB } from "./db/index.js";

import userRoutes from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js"


const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

// Database connection
await connectDB();

app.get("/", (req, res) => {
  return res.status(200).json({
    statusCode: 200,
    success: true,
    message: "Welcome to Backend Practice",
  });
});

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/videos", videoRouter)


app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    statusCode,
    success: false,
    message: err.message || "Internal server error",
  });
});

export default app;