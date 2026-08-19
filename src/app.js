import express, { urlencoded } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors';
const app = express()

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));  // we can use extended objects. objects in objects
// app.use(app.static('public'));
app.use(cookieParser());

// routes import
import userRoutes from './routes/user.routes.js'

// routes declaration
app.use("/api/v1/users", userRoutes);

// Error handler to show error as json not stack trace
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    statusCode,
    success: false,
    message: err.message || "Internal server error"
  });
});
export { app }
