import 'dotenv/config';
import express from 'express'
import cors from 'cors';
import mongoose from 'mongoose';
import { DB_NAME } from './constants.js';
import { connectDB } from './db/index.js';
const app = express()
app.use(cors());

const port = process.env.PORT || 3000

connectDB();

// iife function
// (async () => {
//   try {
//    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//     app.on('error', (error) => {
//       console.error("Error connecting to database",error)
//       throw error
//     })
//     app.listen(port, () => {
//       console.log(`Server is running on port ${port}`)
//     })
//   } catch (error) {
//     console.error("Database connection error", error)
//     throw error
//   }
// })()


