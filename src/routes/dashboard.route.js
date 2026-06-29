import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();
// router.get("/stats", verifyJWT, getDashboardStats);
router.route("/stats").get(verifyJWT,getDashboardStats);

export default router;