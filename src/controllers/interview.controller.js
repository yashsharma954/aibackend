// import {asyncHandler} from "../utilis/asyncHandler.js";
// import {ApiError} from "../utilis/ApiError.js";
// import {ApiResponse} from "../utilis/ApiResponse.js";
// import { User } from "../models/user.model.js";
// import { Resume } from "../models/resume.model.js";
// import { Interview } from "../models/interview.model.js";
// import { Question } from "../models/question.model.js";
// import Groq from "groq-sdk";

// const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// const generateInterview = asyncHandler(async (req, res) => {
//     const userId = req.user?._id;
//     const { resumeId, role, difficulty } = req.body;

//     // ── Validation ──
//     if (!resumeId || !role) {
//         throw new ApiError(400, "resumeId aur Role dono required hain");
//     }

//     if (!userId) {
//         throw new ApiError(401, "Unauthorized");
//     }

//     // ── Resume fetch karo ──
//     const resume = await Resume.findOne({ _id: resumeId, user: userId });
//     if (!resume) {
//         throw new ApiError(404, "Resume nahi mila");
//     }

//     const resumeText = resume.parsedData?.fullText || "";
//     const skills = resume.parsedData?.skills || [];
//     const experienceLevel = resume.analysis?.experienceLevel || "Intermediate";
//     const strengths = resume.analysis?.strengths || [];
    

//     if (resumeText.length < 50) {
//         throw new ApiError(400, "Resume mein enough text nahi hai");
//     }

//     // ── Groq se questions generate karo ──
//     const completion = await groq.chat.completions.create({
//        model: "openai/gpt-oss-120b",
//         messages: [
//             {
//                 role: "system",
//                 content: "You are an expert technical interviewer. Generate interview questions based on the candidate's resume and target Role. Always respond with valid JSON only, no markdown, no explanation, no extra text."
//             },
//             {
//                 role: "user",
//                 content: `Generate exactly 8 interview questions for this candidate.

// Target Role: ${role}
// Difficulty: ${difficulty || "Medium"}
// Experience Level: ${experienceLevel}
// Candidate Skills: ${JSON.stringify(skills)}
// Strengths: ${JSON.stringify(strengths)}
// Resume Text: ${resumeText.substring(0, 3000)}

// Return JSON in this exact format:
// {
//   "questions": [
//     {
//       "questionText": "Tell me about yourself and your experience",
//       "questionType": "hr",
//       "difficulty": "easy",
//       "expectedAnswer": "Candidate should mention their background, skills and why they are suitable for the Role"
//     },
//     {
//       "questionText": "Explain a challenging project you worked on",
//       "questionType": "project",
//       "difficulty": "medium",
//       "expectedAnswer": "Should describe the problem, their Role, technologies used and outcome"
//     }
//   ],
//   "tips": [
//     "Be specific with examples",
//     "Use STAR method for behavioral questions"
//   ]
// }`
//             }
//         ],
//         temperature: 0.5,
//     });

//     // ── Response parse karo ──
//     const responseText = completion.choices[0]?.message?.content || "{}";
//     const cleaned = responseText.replace(/```json|```/g, "").trim();
    
//     let aiData;
//     try {
//         aiData = JSON.parse(cleaned);
//     } catch (parseError) {
//         throw new ApiError(500, "AI response parse karne mein problem hui");
//     }

//     if (!aiData.questions || aiData.questions.length === 0) {
//         throw new ApiError(500, "AI questions generate karne mein fail ho gaya");
//     }
//     const ALLOWED_TYPES = ["technical", "behavioral", "hr", "project", "situational"];
// const ALLOWED_DIFFICULTY = ["easy", "medium", "hard"];

//     // ── Interview DB mein save karo ──
//     const interview = await Interview.create({
//         user: userId,
//         resume: resumeId,
//         Role: role,
//         mode: (difficulty || "medium").toLowerCase(),
//         status: "pending",
//         tips: aiData.tips || [],
//     });

//     // ── Questions alag alag save karo ──
//     const questionDocs = await Question.insertMany(
//     aiData.questions.map((q) => {
//         const type = String(q.questionType || "").toLowerCase().trim();
//         const diff = String(q.difficulty || "").toLowerCase().trim();
//         return {
//             interview: interview._id,
//             user: userId,
//             questionText: q.questionText,
//             expectedAnswer: q.expectedAnswer || "",
//             questionType: ALLOWED_TYPES.includes(type) ? type : "technical",
//             difficulty: ALLOWED_DIFFICULTY.includes(diff) ? diff : "medium",
//             isAnswered: false,
//         };
//     })
// );

//     // ── Interview mein questions ki IDs daalo ──
//     interview.questions = questionDocs.map((q) => q._id);
//     await interview.save();

//     // ── Response bhejo questions ke saath ──
//     return res.status(201).json(
//         new ApiResponse(201, {
//             _id: interview._id,
//             Role: interview.Role,
//             mode: interview.mode,
//             tips: interview.tips,
//             questions: questionDocs,   // frontend ko poore questions chahiye IDs nahi
//         }, "Interview successfully generate hua")
//     );
// });





// const submitAnswer = asyncHandler(async (req, res) => {
//     const userId = req.user?._id;
//     const { interviewId, questionId, userAnswer } = req.body;

//     // ── Validation ──
//     if (!interviewId || !questionId || !userAnswer) {
//         throw new ApiError(400, "interviewId, questionId aur userAnswer teeno required hain");
//     }

//     if (userAnswer.trim().length < 5) {
//         throw new ApiError(400, "Answer bahut chota hai");
//     }

//     // ── Interview verify karo ──
//     const interview = await Interview.findOne({ _id: interviewId, user: userId });
//     if (!interview) {
//         throw new ApiError(404, "Interview nahi mila");
//     }

//     if (interview.status === "completed") {
//         throw new ApiError(400, "Ye interview already complete ho chuka hai");
//     }

//     // ── Question verify karo ──
//     const question = await Question.findOne({ _id: questionId, interview: interviewId, user: userId });
//     if (!question) {
//         throw new ApiError(404, "Question nahi mila");
//     }

//     // ── Groq se feedback lo ──
//     const completion = await groq.chat.completions.create({
//        model: "openai/gpt-oss-120b",
//        messages: [
//             {
//                 role: "system",
//                 content: "You are an expert technical interviewer. Evaluate the candidate's answer and return valid JSON only. No markdown, no explanation, just JSON."
//             },
//             {
//                 role: "user",
//                 content: `Evaluate this interview answer carefully.

// Question: ${question.questionText}
// Question Type: ${question.questionType}
// Expected Answer Hint: ${question.expectedAnswer || "Not provided"}
// Candidate's Answer: ${userAnswer}
//  - questionType MUST be exactly one of: technical, behavioral, hr, project, situational
// - difficulty MUST be exactly one of: easy, medium, hard
// Return JSON in this exact format:
// {
//   "score": 75,
//   "strengths": ["Clear explanation", "Used real example"],
//   "improvements": ["Add more technical details", "Mention specific tools used"],
//   "detailedFeedback": "Your answer was good but could be improved by...",
//   "grammarScore": 80,
//   "confidenceScore": 70,
//   "contentRelevance": 85,
//   "verdict": "Good"
// }

// Rules:
// - score: 0-100
// - grammarScore: 0-100 (language quality)
// - confidenceScore: 0-100 (how confident the answer sounds)
// - contentRelevance: 0-100 (how relevant to the question)
// - verdict: "Excellent" | "Good" | "Average" | "Needs Improvement"
// - strengths: 2-3 points
// - improvements: 2-3 actionable suggestions`
//             }
//         ],
//         temperature: 0.3,
//     });

//     // ── Response parse karo ──
//     const responseText = completion.choices[0]?.message?.content || "{}";
//     const cleaned = responseText.replace(/```json|```/g, "").trim();

//     let feedback;
//     try {
//         feedback = JSON.parse(cleaned);
//     } catch (parseError) {
//         throw new ApiError(500, "AI feedback parse karne mein problem hui");
//     }

//     // ── Question update karo ──
//     question.userAnswer = userAnswer;
//     question.feedback = {
//         score: feedback.score || 0,
//         strengths: feedback.strengths || [],
//         improvements: feedback.improvements || [],
//         detailedFeedback: feedback.detailedFeedback || "",
//         grammarScore: feedback.grammarScore || 0,
//         confidenceScore: feedback.confidenceScore || 0,
//         contentRelevance: feedback.contentRelevance || 0,
//     };
//     question.isAnswered = true;
//     await question.save();

//     // ── Interview status ongoing karo ──
//     if (interview.status === "pending") {
//         interview.status = "in_progress";
//         if (!interview.startedAt) {
//             interview.startedAt = new Date();
//         }
//         await interview.save();
//     }

//     // ── Check: kya saare questions answer ho gaye ──
//     const totalQuestions = await Question.countDocuments({ interview: interviewId });
//     const answeredQuestions = await Question.countDocuments({ interview: interviewId, isAnswered: true });

//     let interviewCompleted = false;

//     if (answeredQuestions === totalQuestions) {
//         // Average score calculate karo
//         const allQuestions = await Question.find({ interview: interviewId });
//         const totalScore = allQuestions.reduce((sum, q) => sum + (q.feedback?.score || 0), 0);
//         const avgScore = Math.round(totalScore / totalQuestions);

//         // Overall feedback generate karo
//         const overallCompletion = await groq.chat.completions.create({
//            model: "openai/gpt-oss-120b",
//             max_completion_tokensessages: [
//                 {
//                     role: "system",
//                     content: "You are an expert interviewer. Write a short overall feedback summary. Plain text only, no JSON, no markdown."
//                 },
//                 {
//                     role: "user",
//                     content: `Write a 2-3 sentence overall interview feedback for a candidate who scored ${avgScore}/100 in a ${interview.Role} interview. Be constructive and encouraging.`
//                 }
//             ],
//             temperature: 0.4,
//         });

//         const overallFeedback = overallCompletion.choices[0]?.message?.content || "";

//         interview.status = "completed";
//         interview.totalScore = avgScore;
//         interview.overallFeedback = overallFeedback;
//         interview.completedAt = new Date();
//         await interview.save();

//         interviewCompleted = true;
//     }

//     return res.status(200).json(
//         new ApiResponse(200, {
//             feedback,
//             verdict: feedback.verdict,
//             isAnswered: true,
//             interviewCompleted,
//             progress: `${answeredQuestions}/${totalQuestions}`,
//         }, "Answer submitted aur evaluated hua")
//     );
// });

// const getInterviewResult = asyncHandler(async (req, res) => {
//     const userId = req.user?._id;
//     const { interviewId } = req.params;

//     const interview = await Interview.findOne({ _id: interviewId, user: userId })
//         .populate("resume", "fileName");

//     if (!interview) throw new ApiError(404, "Interview nahi mila");

//     // Saare questions + feedback fetch karo
//     const questions = await Question.find({ interview: interviewId, user: userId });

//     return res.status(200).json(
//         new ApiResponse(200, {
//             interview,
//             questions,
//         }, "Result fetch hua")
//     );
// });
// const getMyInterviews = asyncHandler(async (req, res) => {
//     const userId = req.user?._id;

//     const interviews = await Interview.find({ user: userId })
//         .sort({ createdAt: -1 })
//         .populate("resume", "fileName");

//     const formatted = interviews.map(i => ({
//         _id: i._id,
//         Role: i.Role,
//         mode: i.mode,
//         status: i.status,
//         totalScore: i.totalScore || 0,
//         totalQuestions: i.questions.length,
//         resumeName: i.resume?.fileName || "Unknown",
//         completedAt: i.completedAt,
//         createdAt: i.createdAt,
//     }));

//     return res.status(200).json(
//         new ApiResponse(200, formatted, "Interviews fetched")
//     );
// });

// export {  getMyInterviews };

// export {  getInterviewResult };

// export { submitAnswer };
// export { generateInterview };


import { asyncHandler } from "../utilis/asyncHandler.js";
import { ApiError } from "../utilis/ApiError.js";
import { ApiResponse } from "../utilis/ApiResponse.js";
import { Resume } from "../models/resume.model.js";
import { Interview } from "../models/interview.model.js";
import { Question } from "../models/question.model.js";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = "openai/gpt-oss-120b";

// Question model ke enum se match karna chahiye
const ALLOWED_TYPES = ["technical", "behavioral", "hr", "project", "situational"];
const ALLOWED_DIFFICULTY = ["easy", "medium", "hard"];

// AI response se JSON nikalne ka safe helper
const parseAIJson = (text) => {
    const cleaned = (text || "").replace(/```json|```/g, "").trim();
    try {
        return JSON.parse(cleaned);
    } catch {
        // agar AI ne JSON ke aage peeche extra text likh diya ho
        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");
        if (start !== -1 && end > start) {
            return JSON.parse(cleaned.slice(start, end + 1));
        }
        throw new Error("Invalid JSON");
    }
};

// number ko 0-100 ke beech rakhta hai
const clampScore = (n) => {
    const num = Number(n);
    if (Number.isNaN(num)) return 0;
    return Math.max(0, Math.min(100, Math.round(num)));
};

const generateInterview = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { resumeId, role, difficulty } = req.body;

    // ── Validation ──
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    if (!resumeId || !role) {
        throw new ApiError(400, "resumeId aur Role dono required hain");
    }

    // ── Resume fetch karo ──
    const resume = await Resume.findOne({ _id: resumeId, user: userId });
    if (!resume) {
        throw new ApiError(404, "Resume nahi mila");
    }

    const resumeText = resume.parsedData?.fullText || "";
    const skills = resume.parsedData?.skills || [];
    const experienceLevel = resume.analysis?.experienceLevel || "Intermediate";
    const strengths = resume.analysis?.strengths || [];

    if (resumeText.length < 50) {
        throw new ApiError(400, "Resume mein enough text nahi hai");
    }

    // difficulty ko enum ke hisaab se safe banao
    const modeValue = String(difficulty || "medium").toLowerCase().trim();
    const mode = ALLOWED_DIFFICULTY.includes(modeValue) ? modeValue : "medium";

    // ── Groq se questions generate karo ──
    let completion;
    try {
        completion = await groq.chat.completions.create({
            model: MODEL,
            messages: [
                {
                    role: "system",
                    content:
                        "You are an expert technical interviewer. Generate interview questions based on the candidate's resume and target Role. Always respond with valid JSON only, no markdown, no explanation, no extra text.",
                },
                {
                    role: "user",
                    content: `Generate exactly 8 interview questions for this candidate.

Target Role: ${role}
Difficulty: ${mode}
Experience Level: ${experienceLevel}
Candidate Skills: ${JSON.stringify(skills)}
Strengths: ${JSON.stringify(strengths)}
Resume Text: ${resumeText.substring(0, 3000)}

Rules:
- questionType MUST be exactly one of: ${ALLOWED_TYPES.join(", ")}
- difficulty MUST be exactly one of: ${ALLOWED_DIFFICULTY.join(", ")}

Return JSON in this exact format:
{
  "questions": [
    {
      "questionText": "Tell me about yourself and your experience",
      "questionType": "hr",
      "difficulty": "easy",
      "expectedAnswer": "Candidate should mention their background, skills and why they are suitable for the Role"
    },
    {
      "questionText": "Explain a challenging project you worked on",
      "questionType": "project",
      "difficulty": "medium",
      "expectedAnswer": "Should describe the problem, their Role, technologies used and outcome"
    }
  ],
  "tips": [
    "Be specific with examples",
    "Use STAR method for behavioral questions"
  ]
}`,
                },
            ],
            temperature: 0.5,
        });
    } catch (err) {
        console.error("Groq generate failed:", err.message);
        throw new ApiError(502, "AI se questions nahi mile, thodi der baad try karo");
    }

    // ── Response parse karo ──
    const responseText = completion.choices[0]?.message?.content || "{}";

    let aiData;
    try {
        aiData = parseAIJson(responseText);
    } catch (parseError) {
        throw new ApiError(500, "AI response parse karne mein problem hui");
    }

    if (!Array.isArray(aiData.questions) || aiData.questions.length === 0) {
        throw new ApiError(500, "AI questions generate karne mein fail ho gaya");
    }

    // ── Interview DB mein save karo ──
    const interview = await Interview.create({
        user: userId,
        resume: resumeId,
        Role: role,
        mode,
        status: "pending",
        tips: Array.isArray(aiData.tips) ? aiData.tips : [],
    });

    // ── Questions alag alag save karo ──
    const questionDocs = await Question.insertMany(
        aiData.questions.map((q) => {
            const type = String(q.questionType || "").toLowerCase().trim();
            const diff = String(q.difficulty || "").toLowerCase().trim();
            return {
                interview: interview._id,
                user: userId,
                questionText: q.questionText,
                expectedAnswer: q.expectedAnswer || "",
                questionType: ALLOWED_TYPES.includes(type) ? type : "technical",
                difficulty: ALLOWED_DIFFICULTY.includes(diff) ? diff : "medium",
                isAnswered: false,
            };
        })
    );

    // ── Interview mein questions ki IDs daalo ──
    interview.questions = questionDocs.map((q) => q._id);
    await interview.save();

    // ── Response bhejo questions ke saath ──
    return res.status(201).json(
        new ApiResponse(
            201,
            {
                _id: interview._id,
                Role: interview.Role,
                mode: interview.mode,
                tips: interview.tips,
                questions: questionDocs,
            },
            "Interview successfully generate hua"
        )
    );
});

const submitAnswer = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { interviewId, questionId, userAnswer } = req.body;

    // ── Validation ──
    if (!interviewId || !questionId || !userAnswer) {
        throw new ApiError(400, "interviewId, questionId aur userAnswer teeno required hain");
    }

    if (userAnswer.trim().length < 5) {
        throw new ApiError(400, "Answer bahut chota hai");
    }

    // ── Interview verify karo ──
    const interview = await Interview.findOne({ _id: interviewId, user: userId });
    if (!interview) {
        throw new ApiError(404, "Interview nahi mila");
    }

    if (interview.status === "completed") {
        throw new ApiError(400, "Ye interview already complete ho chuka hai");
    }

    // ── Question verify karo ──
    const question = await Question.findOne({ _id: questionId, interview: interviewId, user: userId });
    if (!question) {
        throw new ApiError(404, "Question nahi mila");
    }

    // ── Groq se feedback lo ──
    let completion;
    try {
        completion = await groq.chat.completions.create({
            model: MODEL,
            messages: [
                {
                    role: "system",
                    content:
                        "You are an expert technical interviewer. Evaluate the candidate's answer and return valid JSON only. No markdown, no explanation, just JSON.",
                },
                {
                    role: "user",
                    content: `Evaluate this interview answer carefully.

Question: ${question.questionText}
Question Type: ${question.questionType}
Expected Answer Hint: ${question.expectedAnswer || "Not provided"}
Candidate's Answer: ${userAnswer}

Return JSON in this exact format:
{
  "score": 75,
  "strengths": ["Clear explanation", "Used real example"],
  "improvements": ["Add more technical details", "Mention specific tools used"],
  "detailedFeedback": "Your answer was good but could be improved by...",
  "grammarScore": 80,
  "confidenceScore": 70,
  "contentRelevance": 85,
  "verdict": "Good"
}

Rules:
- score: 0-100
- grammarScore: 0-100 (language quality)
- confidenceScore: 0-100 (how confident the answer sounds)
- contentRelevance: 0-100 (how relevant to the question)
- verdict: "Excellent" | "Good" | "Average" | "Needs Improvement"
- strengths: 2-3 points
- improvements: 2-3 actionable suggestions`,
                },
            ],
            temperature: 0.3,
        });
    } catch (err) {
        console.error("Groq evaluate failed:", err.message);
        throw new ApiError(502, "AI se feedback nahi mila, dobara try karo");
    }

    // ── Response parse karo ──
    const responseText = completion.choices[0]?.message?.content || "{}";

    let feedback;
    try {
        feedback = parseAIJson(responseText);
    } catch (parseError) {
        throw new ApiError(500, "AI feedback parse karne mein problem hui");
    }

    // ── Question update karo ──
    question.userAnswer = userAnswer;
    question.feedback = {
        score: clampScore(feedback.score),
        strengths: Array.isArray(feedback.strengths) ? feedback.strengths : [],
        improvements: Array.isArray(feedback.improvements) ? feedback.improvements : [],
        detailedFeedback: feedback.detailedFeedback || "",
        grammarScore: clampScore(feedback.grammarScore),
        confidenceScore: clampScore(feedback.confidenceScore),
        contentRelevance: clampScore(feedback.contentRelevance),
    };
    question.isAnswered = true;
    await question.save();

    // ── Interview status ongoing karo ──
    if (interview.status === "pending") {
        interview.status = "in_progress";
        if (!interview.startedAt) {
            interview.startedAt = new Date();
        }
        await interview.save();
    }

    // ── Check: kya saare questions answer ho gaye ──
    const totalQuestions = await Question.countDocuments({ interview: interviewId });
    const answeredQuestions = await Question.countDocuments({ interview: interviewId, isAnswered: true });

    let interviewCompleted = false;

    if (totalQuestions > 0 && answeredQuestions === totalQuestions) {
        // Average score calculate karo
        const allQuestions = await Question.find({ interview: interviewId });
        const totalScore = allQuestions.reduce((sum, q) => sum + (q.feedback?.score || 0), 0);
        const avgScore = Math.round(totalScore / totalQuestions);

        // Overall feedback generate karo (fail bhi ho to interview complete hona chahiye)
        let overallFeedback = "";
        try {
            const overallCompletion = await groq.chat.completions.create({
                model: MODEL,
                messages: [
                    {
                        role: "system",
                        content:
                            "You are an expert interviewer. Write a short overall feedback summary. Plain text only, no JSON, no markdown.",
                    },
                    {
                        role: "user",
                        content: `Write a 2-3 sentence overall interview feedback for a candidate who scored ${avgScore}/100 in a ${interview.Role} interview. Be constructive and encouraging.`,
                    },
                ],
                temperature: 0.4,
            });
            overallFeedback = overallCompletion.choices[0]?.message?.content || "";
        } catch (err) {
            console.error("Overall feedback failed:", err.message);
        }

        interview.status = "completed";
        interview.totalScore = avgScore;
        interview.overallFeedback = overallFeedback;
        interview.completedAt = new Date();
        if (interview.startedAt) {
            interview.duration = Math.max(
                1,
                Math.round((interview.completedAt - interview.startedAt) / 60000)
            );
        }
        await interview.save();

        interviewCompleted = true;
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                feedback,
                verdict: feedback.verdict,
                isAnswered: true,
                interviewCompleted,
                progress: `${answeredQuestions}/${totalQuestions}`,
            },
            "Answer submitted aur evaluated hua"
        )
    );
});

const getInterviewResult = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { interviewId } = req.params;

    const interview = await Interview.findOne({ _id: interviewId, user: userId })
        .populate("resume", "fileName");

    if (!interview) throw new ApiError(404, "Interview nahi mila");

    // Saare questions + feedback fetch karo
    const questions = await Question.find({ interview: interviewId, user: userId });

    // Self-heal: saare answered hain par interview complete nahi hua (purane stuck interviews)
    const allAnswered = questions.length > 0 && questions.every((q) => q.isAnswered);
    if (allAnswered && (interview.status !== "completed" || !interview.totalScore)) {
        const total = questions.reduce((s, q) => s + (q.feedback?.score || 0), 0);
        interview.totalScore = Math.round(total / questions.length);
        interview.status = "completed";
        interview.completedAt = interview.completedAt || new Date();
        await interview.save();
    }

    return res.status(200).json(
        new ApiResponse(200, { interview, questions }, "Result fetch hua")
    );
});

const getMyInterviews = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    const interviews = await Interview.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate("resume", "fileName");

    const formatted = interviews.map((i) => ({
        _id: i._id,
        Role: i.Role,
        mode: i.mode,
        status: i.status,
        totalScore: i.totalScore || 0,
        totalQuestions: i.questions.length,
        resumeName: i.resume?.fileName || "Unknown",
        completedAt: i.completedAt,
        createdAt: i.createdAt,
    }));

    return res.status(200).json(
        new ApiResponse(200, formatted, "Interviews fetched")
    );
});

export { generateInterview, submitAnswer, getInterviewResult, getMyInterviews };
