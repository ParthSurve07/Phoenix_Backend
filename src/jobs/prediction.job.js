import cron from "node-cron";
import prisma from "../config/db.js";
import { fetchMLPredictions } from "../services/ml.service.js";
import logger from "../utils/logger.js";

export const startPredictionJob = () => {
  // Runs Mon-Fri at 6PM IST (12:30 UTC) — after market close
  cron.schedule("30 12 * * 1-5", async () => {
    logger.info("Prediction job started");

    try {
      // Get all unique symbols across all portfolios
      const portfolios = await prisma.portfolio.findMany({
        select: { symbol: true },
        distinct: ["symbol"],
      });

      if (portfolios.length === 0) {
        logger.info("No symbols found, skipping prediction job");
        return;
      }

      const symbols = portfolios.map((p) => p.symbol);
      logger.info(`Running predictions for ${symbols.length} symbols`);

      const mlResults = await fetchMLPredictions(symbols);

      await prisma.prediction.createMany({
        data: mlResults.map((r) => ({
          symbol: r.symbol,
          mlProbability: r.ml_probability,
          trendScore: r.trend_score,
          momentumScore: r.momentum_score,
          hybridScore: r.hybrid_score,
          signal: r.signal,
        })),
      });

      logger.info(`Stored ${mlResults.length} predictions`);
    } catch (err) {
      logger.error({ err }, "Prediction job failed");
    }
  });

  logger.info("Prediction job scheduled — runs Mon-Fri at 6PM IST");
};