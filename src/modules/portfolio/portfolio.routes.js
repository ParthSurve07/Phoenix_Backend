import { Router } from "express";
import {
  getPortfolio,
  addHolding,
  updateHolding,
  deleteHolding,
  syncAngelOne,
  uploadZerodhaCSV,
} from "./portfolio.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.use(authenticate);

router.get("/", getPortfolio);
router.post("/", addHolding);
router.put("/:id", updateHolding);
router.delete("/:id", deleteHolding);
router.post("/angelone", syncAngelOne);
router.post("/zerodha-upload", upload.single("file"), uploadZerodhaCSV);

export default router;