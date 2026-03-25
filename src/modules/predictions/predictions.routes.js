import { Router } from "express";
import { getPredictions, storePredictions } from "./predictions.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", getPredictions);
router.post("/", storePredictions);

export default router;