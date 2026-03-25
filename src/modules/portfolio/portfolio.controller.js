import { z } from "zod";
import {
  getUserPortfolio,
  addUserHolding,
  updateUserHolding,
  deleteUserHolding,
  syncFromAngelOne,
  syncFromZerodhaCSV,
} from "./portfolio.service.js";

const holdingSchema = z.object({
  symbol: z.string().min(1),
  quantity: z.number().positive(),
  avgPrice: z.number().positive(),
  currentPrice: z.number().positive(),
});

const angelOneSchema = z.object({
  clientId: z.string().min(1),
  password: z.string().min(1),
  totpSecret: z.string().min(1),
});

export const getPortfolio = async (req, res, next) => {
  try {
    const data = await getUserPortfolio(req.user.userId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const addHolding = async (req, res, next) => {
  try {
    const parsed = holdingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
    const data = await addUserHolding(req.user.userId, parsed.data);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

export const updateHolding = async (req, res, next) => {
  try {
    const data = await updateUserHolding(req.user.userId, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const deleteHolding = async (req, res, next) => {
  try {
    await deleteUserHolding(req.user.userId, req.params.id);
    res.json({ success: true, message: "Holding deleted" });
  } catch (err) { next(err); }
};

export const syncAngelOne = async (req, res, next) => {
  try {
    const parsed = angelOneSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
    const data = await syncFromAngelOne(req.user.userId, parsed.data);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const uploadZerodhaCSV = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const data = await syncFromZerodhaCSV(req.user.userId, req.file.buffer);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};