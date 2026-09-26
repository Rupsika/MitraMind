import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../prisma/client";
import { AppError } from "../utils/errors";

const BCRYPT_ROUNDS = 12;

type UserRow = { id: string; name: string; email: string; preferredLanguage: string; timezone: string };

export function publicUser(u: UserRow) {
  return { id: u.id, name: u.name, email: u.email, preferredLanguage: u.preferredLanguage, timezone: u.timezone };
}

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
}

export const authService = {
  async register(input: { name: string; email: string; password: string; preferredLanguage: string; timezone: string }) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError(409, "An account with this email already exists", "email_taken");
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        preferredLanguage: input.preferredLanguage,
        timezone: input.timezone,
      },
    });
    await prisma.profile.create({ data: { userId: user.id } });
    return { user: publicUser(user), token: signToken(user.id) };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Same error for unknown email and wrong password to avoid account enumeration.
    const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !ok) throw new AppError(401, "Incorrect email or password", "invalid_credentials");
    return { user: publicUser(user), token: signToken(user.id) };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(401, "Account no longer exists", "unauthorized");
    return publicUser(user);
  },

  async updateProfile(
    userId: string,
    input: { name?: string; preferredLanguage?: string; timezone?: string; notificationPreferences?: Record<string, boolean> },
  ) {
    const { notificationPreferences, ...userFields } = input;
    const user = await prisma.user.update({ where: { id: userId }, data: userFields });
    if (notificationPreferences) {
      await prisma.profile.update({ where: { userId }, data: { notificationPreferences } });
    }
    return publicUser(user);
  },
};
