import { Router } from "express";
import { getRiskInsights, analyzeRisk } from "./risk.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", getRiskInsights);
router.post("/analyze", analyzeRisk);

export default router;