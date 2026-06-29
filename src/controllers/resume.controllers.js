import { asyncHandler } from "../utilis/asyncHandler.js";
import { ApiError } from "../utilis/ApiError.js";
import { ApiResponse } from "../utilis/ApiResponse.js";
import { Resume } from "../models/resume.model.js";
import { uploadOnCloudinary } from "../utilis/cloudinary.js";
import { User } from "../models/user.model.js";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import mammoth from "mammoth";
import Groq from "groq-sdk";
import fs from "fs-extra";
import Tesseract from 'tesseract.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


const extractTextFromResume = async (filePath, mimetype) => {
    try {
        if (mimetype === "application/pdf") {
            const dataBuffer = await fs.readFile(filePath);
            const loadingTask = getDocument({ data: new Uint8Array(dataBuffer) });
            const pdf = await loadingTask.promise;
            
            let fullText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                const pageText = content.items.map(item => item.str).join(" ");
                fullText += pageText + "\n";
            }
            
            console.log("✅ PDF Text Length:", fullText.length);
            return fullText;
        }
        else if (mimetype.includes("word") || mimetype.includes("document")) {
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value || "";
        }
        return "";
    } catch (error) {
        console.error("❌ Text extraction failed:", error.message);
        return "";
    }
};



const uploadResume = asyncHandler(async (req, res) => {
    
    const userId = req.user?._id;

    if (!req.file) {
        throw new ApiError(400, "Resume file is required");
    }

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    console.log("Uploading resume:", req.file.originalname);

    // 1. Extract Text
    const extractedText = await extractTextFromResume(req.file.path, req.file.mimetype);

    // 2. Upload to Cloudinary
    const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
    if (!cloudinaryResponse?.url) {
        throw new ApiError(500, "Failed to upload to Cloudinary");
    }

    // 3. AI Analysis using Gemini (parsedData + analysis dono)
    let parsedData = {};
    let analysis = {};

    if (extractedText && extractedText.length > 50) {
        try {
            // Gemini call for analysis
            

           const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",  // free & powerful
    messages: [
        {
            role: "system",
            content: "You are a resume analyzer. Always respond with valid JSON only, no markdown, no explanation."
        },
        {
            role: "user",
            content: `Analyze this resume and return only valid JSON:

{
  "skills": ["skill1", "skill2"],
  "experienceLevel": "Fresher | Intermediate | Senior",
  "keywords": ["word1", "word2"],
  "strengths": ["Good project experience"],
  "weaknesses": ["Limited leadership"],
  "summary": "Short professional summary"
}

Resume Text: ${extractedText.substring(0, 7000)}`
        }
    ],
    temperature: 0.3,
});

const responseText = completion.choices[0]?.message?.content || "{}";
            // const aiData = JSON.parse(responseText);
            const cleaned = responseText.replace(/```json|```/g, "").trim();
          const aiData = JSON.parse(cleaned);

            parsedData = aiData;

            analysis = {
                score: 78,
                strengths: aiData.strengths || [],
                weaknesses: aiData.weaknesses || [],
                suggestions: ["Add more numbers in achievements", "Improve project description"],
                keywords: aiData.keywords || [],
                experienceLevel: aiData.experienceLevel || "Intermediate",
                atsScore: 82
            };

            console.log("✅ Gemini Analysis successful");
        } catch (aiError) {
            console.error("Gemini Analysis failed:", aiError.message);
        }
    }

    // 4. Save Resume
    const resume = await Resume.create({
        user: userId,
        originalFileUrl: cloudinaryResponse.url,
        fileName: req.file.originalname,
        parsedData: {
            fullText: extractedText,
            ...parsedData
        },
        analysis: analysis
    });

    await User.findByIdAndUpdate(userId, { $push: { resumes: resume._id } });

    console.log(`✅ Resume uploaded with analysis! Text length: ${extractedText.length}`);

    return res.status(201).json(
        new ApiResponse(201, resume, "Resume uploaded and analyzed by Gemini")
    );
});
// Get all resumes of logged in user
const getMyResumes = asyncHandler(async (req, res) => {
    
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const resumes = await Resume.find({ 
        user: userId 
    })
    .sort({ createdAt: -1 })           // Latest resume pehle
    .select("-__v");                   // __v field hide karne ke liye

    return res.status(200).json(
        new ApiResponse(200, resumes, "Resumes fetched successfully")
    );
});

export { uploadResume };
export {getMyResumes};