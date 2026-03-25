import axios from "axios";
import logger from "../utils/logger.js";

export const fetchMLPredictions = async (symbols) => {
  try {
    const res = await axios.post(`${process.env.ML_SERVICE_URL}/predict`, {
      symbols,
    });
    return res.data;
  } catch (err) {
    logger.error({ mlError: err?.response?.data || err.message }, "ML service request failed");
    const error = new Error("ML service unavailable");
    error.status = 503;
    throw error;
  }
};