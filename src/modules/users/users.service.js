import bcrypt from "bcryptjs";
import prisma from "../../config/db.js";

export const getUserProfile = async (userId) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, createdAt: true },
  });
};

export const updateUserProfile = async (userId, { name }) => {
  return prisma.user.update({
    where: { id: userId },
    data: { name },
    select: { id: true, name: true, email: true, createdAt: true },
  });
};

export const changeUserPassword = async (userId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    const error = new Error("Current password is incorrect");
    error.status = 401;
    throw error;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return { message: "Password changed successfully" };
};