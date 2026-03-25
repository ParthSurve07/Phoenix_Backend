import prisma from "../../config/db.js";
import { fetchMLPredictions } from "../../services/ml.service.js";

export const getPredictionsForUser = async (userId) => {
  // Get user's portfolio symbols
  const portfolio = await prisma.portfolio.findMany({
    where: { userId },
    select: { symbol: true },
  });

  if (portfolio.length === 0) return [];

  const symbols = portfolio.map((p) => p.symbol);

  // Fetch predictions for those symbols
  const predictions = await prisma.prediction.findMany({
    where: { symbol: { in: symbols } },
    orderBy: { generatedAt: "desc" },
  });

  // Return latest prediction per symbol
  const seen = new Set();
  return predictions.filter((p) => {
    if (seen.has(p.symbol)) return false;
    seen.add(p.symbol);
    return true;
  });
};

export const runAndStorePredictions = async (userId) => {
  // Get user's portfolio symbols
  const portfolio = await prisma.portfolio.findMany({
    where: { userId },
    select: { symbol: true },
  });

  if (portfolio.length === 0) {
    const error = new Error("No holdings found in portfolio");
    error.status = 400;
    throw error;
  }

  const symbols = portfolio.map((p) => p.symbol);

  // Call ML service
  const mlResults = await fetchMLPredictions(symbols);

  // Store predictions
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

  return getPredictionsForUser(userId);
};

export const computeHybridScore = (mlProbability, trendScore, momentumScore) => {
  return 0.5 * mlProbability + 0.3 * trendScore + 0.2 * momentumScore;
};

export const classifySignal = (hybridScore) => {
  if (hybridScore > 0.6) return "BUY";
  if (hybridScore < 0.4) return "SELL";
  return "NEUTRAL";
};