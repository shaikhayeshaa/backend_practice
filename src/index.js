import 'dotenv/config';
import { connectDB } from './db/index.js';
import { app } from './app.js';

const port = process.env.PORT || 3000

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`)
    })
    app.on('error', (error) => {
      console.error("Error connecting to database", error)
      throw error
    })
  })
  .catch((error) => {
    console.error("Database connection error", error)
  })

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


