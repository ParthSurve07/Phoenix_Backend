import { getLatestRiskInsight, analyzePortfolioRisk } from "./risk.service.js";

export const getRiskInsights = async (req, res, next) => {
  try {
    const insight = await getLatestRiskInsight(req.user.userId);

    if (!insight) {
      return res.json({ success: true, data: null, message: "No risk analysis found. Run /risk/analyze first." });
    }

    const parsed = JSON.parse(insight.analysisText);
    res.json({ success: true, data: { id: insight.id, createdAt: insight.createdAt, ...parsed } });
  } catch (err) {
    next(err);
  }
};

export const analyzeRisk = async (req, res, next) => {
  try {
    const data = await analyzePortfolioRisk(req.user.userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};