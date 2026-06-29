   import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
   const interviewSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    resume: {
        type: Schema.Types.ObjectId,
        ref: "Resume",
        required: true
    },
    role: {
        type: String,
        required: true  // "Frontend Developer", "Backend Engineer" etc
    },
    tips: [{ type: String }],
    
    mode: {
        type: String,
        enum: ["easy", "medium", "hard"],
        default: "medium",
        required: true
    },

    status: {
        type: String,
        enum: ["pending", "in_progress", "completed", "failed"],
        default: "pending"
    },

    questions: [{
        type: Schema.Types.ObjectId,
        ref: "Question"
    }],

    totalScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },

    overallFeedback: String,
    duration: Number,           // in minutes
    startedAt: Date,
    completedAt: Date
}, { timestamps: true });

export const Interview = mongoose.model("Interview", interviewSchema);