import express, { urlencoded } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors';
const app = express()

app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({extended: true}));  // we can use extended objects. objects in objects
app.use(app.static('public'));
app.use(cookieParser());

export { app }
