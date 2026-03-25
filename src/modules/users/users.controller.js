import { z } from "zod";
import { getUserProfile, updateUserProfile, changeUserPassword } from "./users.service.js";

const updateProfileSchema = z.object({
  name: z.string().min(2),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export const getProfile = async (req, res, next) => {
  try {
    const data = await getUserProfile(req.user.userId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const updateProfile = async (req, res, next) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
    const data = await updateUserProfile(req.user.userId, parsed.data);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const changePassword = async (req, res, next) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
    const data = await changeUserPassword(req.user.userId, parsed.data);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};