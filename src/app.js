import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/error.middleware.js";

// Route imports (will fill in as we build each module)
import authRoutes from "./modules/auth/auth.routes.js";
import portfolioRoutes from "./modules/portfolio/portfolio.routes.js";
import predictionRoutes from "./modules/predictions/predictions.routes.js";
import riskRoutes from "./modules/risk/risk.routes.js";
import userRoutes from "./modules/users/users.routes.js";

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:3000" || "https://phoenix-frontend-e9qz.vercel.app/", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/auth", authRoutes);
app.use("/portfolio", portfolioRoutes);
app.use("/predictions", predictionRoutes);
app.use("/risk", riskRoutes);
app.use("/users", userRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "fintrack-backend" });
});

// Error handler — always last
app.use(errorHandler);

export default app;