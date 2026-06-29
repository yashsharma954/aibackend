import { Router} from "express";
import { generateInterview } from "../controllers/interview.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { submitAnswer } from "../controllers/interview.controller.js";
import { getInterviewResult } from "../controllers/interview.controller.js";
import { getMyInterviews } from "../controllers/interview.controller.js";


const router=Router();
router.route("/generate").post(verifyJWT,generateInterview);
router.route("/submit-answer").post(verifyJWT,submitAnswer);
router.route("/result/:interviewId").get(verifyJWT, getInterviewResult);
router.route("/my-interviews").get(verifyJWT, getMyInterviews);



export default router;