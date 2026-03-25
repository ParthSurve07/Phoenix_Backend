import { Router } from "express";
import { getProfile, updateProfile, changePassword } from "./users.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.put("/change-password", changePassword);

export default router;