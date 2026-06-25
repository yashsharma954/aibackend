import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"


const app=express();

app.use(cors({
    origin: process.env.CORS_ORIGIN|| "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


import UserRegister from "./routes/user.route.js";

app.use("/api/v1/user",UserRegister);







export {app}