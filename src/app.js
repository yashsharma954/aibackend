import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "./models/user.model.js";


const app=express();

app.use(cors({
    origin: process.env.CORS_ORIGIN|| "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static("public"));
app.use(cookieParser());
app.use(passport.initialize());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:8000/api/v1/user/google/callback",
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });

      if (!user) {
        user = await User.create({
          fullName: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          avatar: profile.photos?.[0]?.value || "",
          // password: null  // Google users ke liye password optional
        });
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));


import UserRegister from "./routes/user.route.js";
import resume from "./routes/resume.route.js";
import interview from "./routes/interview.route.js";
import dashboard from "./routes/dashboard.route.js";
import { errorHandler } from "./middleware/error.middleware.js";

app.use("/api/v1/user",UserRegister);
app.use("/api/v1/resume",resume);
app.use("/api/v1/interview",interview);
app.use("/api/v1/dashboard",dashboard);
app.use(errorHandler);







export {app}