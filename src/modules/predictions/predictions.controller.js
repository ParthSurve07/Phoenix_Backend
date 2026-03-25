import { z } from "zod";
import {
  getPredictionsForUser,
  runAndStorePredictions,
} from "./predictions.service.js";

const storePredictionsSchema = z.object({
  predictions: z.array(
    z.object({
      symbol: z.string().min(1),
      mlProbability: z.number().min(0).max(1),
      trendScore: z.number().min(0).max(1),
      momentumScore: z.number().min(0).max(1),
    })
  ),
});

export const getPredictions = async (req, res, next) => {
  try {
    const data = await getPredictionsForUser(req.user.userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const storePredictions = async (req, res, next) => {
  try {
    const parsed = storePredictionsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    // Compute hybrid score and signal, then store
    const { predictions } = parsed.data;
    const { computeHybridScore, classifySignal } = await import("./predictions.service.js");

    const enriched = predictions.map((p) => {
      const hybridScore = computeHybridScore(p.mlProbability, p.trendScore, p.momentumScore);
      const signal = classifySignal(hybridScore);
      return { ...p, hybridScore, signal };
    });

    const { PrismaClient } = await import("../../config/db.js");
    const prisma = (await import("../../config/db.js")).default;

    await prisma.prediction.createMany({
      data: enriched.map((p) => ({
        symbol: p.symbol,
        mlProbability: p.mlProbability,
        trendScore: p.trendScore,
        momentumScore: p.momentumScore,
        hybridScore: p.hybridScore,
        signal: p.signal,
      }))
    });

    res.status(201).json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
};