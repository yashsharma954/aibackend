import { asyncHandler } from "../utilis/asyncHandler.js";
import { ApiError } from "../utilis/ApiError.js";
import { ApiResponse } from "../utilis/ApiResponse.js";
import { Interview } from "../models/interview.model.js";
import { Question } from "../models/question.model.js";

const getDashboardStats = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) throw new ApiError(401, "Unauthorized");

    // Saare completed interviews
    const interviews = await Interview.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate("resume", "fileName");

    const completedInterviews = interviews.filter(i => i.status === "completed");

    // Stats calculate karo
    const totalInterviews = completedInterviews.length;
    const avgScore = totalInterviews > 0
        ? Math.round(completedInterviews.reduce((s, i) => s + (i.totalScore || 0), 0) / totalInterviews)
        : 0;
    const bestScore = totalInterviews > 0
        ? Math.max(...completedInterviews.map(i => i.totalScore || 0))
        : 0;

    // Streak calculate karo (consecutive days)
    const streak = calculateStreak(completedInterviews);

    // Recent 5 interviews
    const recentInterviews = completedInterviews.slice(0, 5).map(i => ({
        _id: i._id,
        role: i.role,
        score: i.totalScore || 0,
        status: getScoreLabel(i.totalScore || 0),
        date: i.completedAt || i.createdAt,
        mode: i.mode,
    }));

    // Skill averages from all questions
    const allQuestions = await Question.find({ user: userId, isAnswered: true });

    const skillStats = {
        technicalAccuracy: avg(allQuestions.map(q => q.feedback?.contentRelevance || 0)),
        communication: avg(allQuestions.map(q => q.feedback?.grammarScore || 0)),
        confidence: avg(allQuestions.map(q => q.feedback?.confidenceScore || 0)),
        problemSolving: avg(allQuestions
            .filter(q => q.questionType === "technical")
            .map(q => q.feedback?.score || 0)
        ),
    };

    return res.status(200).json(
        new ApiResponse(200, {
            stats: { totalInterviews, avgScore, bestScore, streak },
            recentInterviews,
            skillStats,
        }, "Dashboard data fetched")
    );
});

// Helper functions
const avg = (arr) => arr.length > 0
    ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
    : 0;

const getScoreLabel = (score) => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 60) return "Average";
    return "Needs Improvement";
};

const calculateStreak = (interviews) => {
    if (interviews.length === 0) return 0;
    const dates = [...new Set(interviews.map(i =>
        new Date(i.completedAt || i.createdAt).toDateString()
    ))].map(d => new Date(d)).sort((a, b) => b - a);

    let streak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
        const diff = (dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24);
        if (diff <= 1) streak++;
        else break;
    }
    return streak;
};

export { getDashboardStats };