  import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

  const resumeSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    originalFileUrl: {
        type: String,        // Cloudinary URL of uploaded PDF/Word
        required: true
    },
    fileName: String,
    parsedData: {            // AI se extracted raw data
        type: Object,
        default: {}
    },
    analysis: {
        score: { type: Number, min: 0, max: 100 },
        strengths: [String],
        weaknesses: [String],
        suggestions: [String],
        keywords: [String],
        experienceLevel: String, // Fresher, Intermediate, Senior
        atsScore: Number
    },
    targetJobTitle: String,
    targetCompany: String,
    
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Resume = mongoose.model("Resume", resumeSchema);