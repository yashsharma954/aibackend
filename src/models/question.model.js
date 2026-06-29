   import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
   const questionSchema = new Schema({
    interview: {
        type: Schema.Types.ObjectId,
        ref: "Interview",
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    questionText: {
        type: String,
        required: true
    },
    expectedAnswer: String,        // AI generated ideal answer (optional)
    
    userAnswer: {
        type: String,
        default: ""
    },
    audioUrl: String,              // Agar voice recording save karna hai
    videoUrl: String,

    feedback: {
        score: {                   // 0-10 ya 0-100
            type: Number,
            min: 0,
            max: 100
        },
        strengths: [String],
        improvements: [String],
        detailedFeedback: String,
        grammarScore: Number,
        confidenceScore: Number,
        contentRelevance: Number
    },
    difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium"
},
isAnswered: {
    type: Boolean,
    default: false
},

    questionType: {
    type: String,
    enum: ["technical", "behavioral", "hr", "project", "situational"], // "situation" → "situational"
    default: "technical"
},
}, { timestamps: true });

export const Question = mongoose.model("Question", questionSchema);