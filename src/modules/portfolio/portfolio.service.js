import prisma from "../../config/db.js";
import { fetchAngelOneHoldings } from "../../services/angelone.service.js";
import { parseZerodhaCSV } from "../../utils/csvParser.js";

export const getUserPortfolio = async (userId) => {
  return prisma.portfolio.findMany({ where: { userId } });
};

export const addUserHolding = async (userId, data) => {
  const { symbol, quantity, avgPrice, currentPrice } = data;
  const marketValue = quantity * currentPrice;
  const pnl = (currentPrice - avgPrice) * quantity;

  return prisma.portfolio.create({
    data: {
      userId,
      symbol,
      quantity,
      avgPrice,
      currentPrice,
      marketValue,
      pnl,
      source: "manual",
    },
  });
};

export const updateUserHolding = async (userId, id, data) => {
  const existing = await prisma.portfolio.findFirst({ where: { id, userId } });
  if (!existing) {
    const error = new Error("Holding not found");
    error.status = 404;
    throw error;
  }

  const quantity = data.quantity ?? existing.quantity;
  const avgPrice = data.avgPrice ?? existing.avgPrice;
  const currentPrice = data.currentPrice ?? existing.currentPrice;
  const marketValue = quantity * currentPrice;
  const pnl = (currentPrice - avgPrice) * quantity;

  return prisma.portfolio.update({
    where: { id },
    data: { quantity, avgPrice, currentPrice, marketValue, pnl },
  });
};

export const deleteUserHolding = async (userId, id) => {
  const existing = await prisma.portfolio.findFirst({ where: { id, userId } });
  if (!existing) {
    const error = new Error("Holding not found");
    error.status = 404;
    throw error;
  }

  return prisma.portfolio.delete({ where: { id } });
};

export const syncFromAngelOne = async (userId, credentials) => {
  const holdings = await fetchAngelOneHoldings(credentials);

  // Delete existing angelone holdings for user
  await prisma.portfolio.deleteMany({ where: { userId, source: "angelone" } });

  // Insert fresh
  await prisma.portfolio.createMany({
    data: holdings.map((h) => ({ ...h, userId })),
  });

  return prisma.portfolio.findMany({ where: { userId, source: "angelone" } });
};

export const syncFromZerodhaCSV = async (userId, fileBuffer) => {
  const holdings = parseZerodhaCSV(fileBuffer);

  // Delete existing zerodha holdings for user
  await prisma.portfolio.deleteMany({ where: { userId, source: "zerodha" } });

  // Insert fresh
  await prisma.portfolio.createMany({
    data: holdings.map((h) => ({ ...h, userId })),
  });

  return prisma.portfolio.findMany({ where: { userId, source: "zerodha" } });
};