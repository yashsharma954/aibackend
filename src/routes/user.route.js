import { registeruser } from "../controllers/user.controllers.js";
import { loginuser } from "../controllers/user.controllers.js";
import passport from "passport";
import { Router} from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { ApiResponse } from "../utilis/ApiResponse.js";

const router=Router();
router.route("/registeruser").post(registeruser);
router.route("/login").post(loginuser);
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// router.get("/google/callback",
//   passport.authenticate("google", { failureRedirect: "/auth" }),
//   (req, res) => {
//     const accessToken = req.user.generateAccessToken();

//     // Frontend ko redirect with token (ya cookie set kar sakte ho)
//     res.redirect(`https://localhost:5173/auth?token=${accessToken}&userId=${req.user._id}`);
//   }
// );
router.get("/google/callback",
    passport.authenticate("google", { 
        failureRedirect: "/auth?error=google_failed",
        session: false 
    }),
    async (req, res) => {                     // ← async bana diya
        try {
            if (!req.user) {
                return res.redirect("/auth?error=user_not_found");
            }

            const accessToken = req.user.generateAccessToken();

            // Frontend ko redirect
            res.redirect(`https://localhost:5173/auth?token=${accessToken}&userId=${req.user._id}`);

        } catch (error) {
            console.error("Google Callback Error:", error);
            res.redirect("/auth?error=server_error");
        }
    }
);
router.get("/me", verifyJWT, async (req, res) => {
    return res.json(
        new ApiResponse(200, req.user, "User profile fetched successfully")
    );
});

export default router;
