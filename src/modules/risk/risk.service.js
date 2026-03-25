import prisma from "../../config/db.js";
import { GoogleGenAI } from "@google/genai";
import logger from "../../utils/logger.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getLatestRiskInsight = async (userId) => {
  return prisma.riskInsight.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

export const analyzePortfolioRisk = async (userId) => {
  const portfolio = await prisma.portfolio.findMany({ where: { userId } });

  if (portfolio.length === 0) {
    const error = new Error("No holdings found in portfolio");
    error.status = 400;
    throw error;
  }

  const totalValue = portfolio.reduce((sum, h) => sum + h.marketValue, 0);
  const holdingsSummary = portfolio.map((h) => ({
    symbol: h.symbol,
    quantity: h.quantity,
    avgPrice: h.avgPrice,
    currentPrice: h.currentPrice,
    marketValue: h.marketValue,
    pnl: h.pnl,
    allocation: ((h.marketValue / totalValue) * 100).toFixed(2) + "%",
  }));

  const prompt = `
You are a financial risk analyst. Analyze the following Indian stock portfolio and provide a structured risk assessment.

Portfolio Holdings:
${JSON.stringify(holdingsSummary, null, 2)}

Total Portfolio Value: ₹${totalValue.toFixed(2)}

Provide a JSON response with exactly this structure:
{
  "overallRisk": "Low" | "Moderate" | "High",
  "riskScore": <number between 0-100>,
  "summary": "<2-3 sentence overall summary>",
  "insights": [
    {
      "type": "warning" | "suggestion",
      "title": "<short title>",
      "description": "<detailed description>"
    }
  ]
}

Focus on: sector concentration, diversification, P&L performance, volatility risk.
Return ONLY the JSON, no markdown, no extra text.
`;

  logger.info("Sending portfolio to Gemini for risk analysis");

  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  const text = result.text;

  logger.info("Gemini response received");

  let analysis;
  try {
    analysis = JSON.parse(text);
  } catch {
    logger.error({ geminiText: text }, "Failed to parse Gemini response");
    const error = new Error("Failed to parse risk analysis");
    error.status = 500;
    throw error;
  }

  const insight = await prisma.riskInsight.create({
    data: {
      userId,
      analysisText: JSON.stringify(analysis),
    },
  });

  return { id: insight.id, createdAt: insight.createdAt, ...analysis };
};