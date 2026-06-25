import { registeruser } from "../controllers/user.controllers.js";
import { Router} from "express";

const router=Router();
router.route("/registeruser").post(registeruser);

export default router;
