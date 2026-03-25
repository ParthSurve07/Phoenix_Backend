import "dotenv/config";
import app from "./app.js";
import { env } from "./config/env.js";
import logger from "./utils/logger.js";
import { startPredictionJob } from "./jobs/prediction.job.js";

app.listen(env.port, () => {
  logger.info(`FinTrack backend running on port ${env.port}`);
  startPredictionJob();
});