import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../config/db.js";
import { env } from "../../config/env.js";

export const registerUser = async ({ name, email, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const error = new Error("Email already in use");
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    env.jwtSecret,
    { expiresIn: "7d" }
  );

  return { token, user: { id: user.id, name: user.name, email: user.email } };
};

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    env.jwtSecret,
    { expiresIn: "7d" }
  );

  return { token, user: { id: user.id, name: user.name, email: user.email } };
};