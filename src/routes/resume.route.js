import { Router} from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { uploadResume } from "../controllers/resume.controllers.js";
import { upload } from "../middleware/multer.middleware.js";
import { getMyResumes } from "../controllers/resume.controllers.js";

const router=Router();
router.route("/upload").post(
    verifyJWT,                                   // Auth middleware
    upload.single("resume"),                     // Multer single file
    uploadResume
);

router.route("/myresume").get(
    verifyJWT,
    getMyResumes
);


export default router;

