import { z } from "zod";

export const language = z.enum(["en", "hi", "te", "ta"]);
const score = z.number().int().min(1).max(10);

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(128),
  preferredLanguage: language.default("en"),
  timezone: z.string().max(64).default("Asia/Kolkata"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
});

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    preferredLanguage: language,
    timezone: z.string().max(64),
    notificationPreferences: z.record(z.boolean()),
  })
  .partial();

export const checkinSchema = z.object({
  mood: score,
  stressLevel: score,
  energyLevel: score,
  sleepQuality: score,
  note: z.string().trim().max(500).optional(),
});

export const createConversationSchema = z.object({
  language: language.optional(),
  title: z.string().trim().min(1).max(100).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  language: language.optional(),
});

export const idParam = z.object({ id: z.string().uuid() });

export const resourceQuery = z.object({
  category: z
    .enum(["STRESS", "SLEEP", "FOCUS", "BREATHING", "GROUNDING", "STUDY_PRESSURE", "GENERAL_WELLBEING"])
    .optional(),
  language: language.optional(),
});

export const safetyAnalyzeSchema = z.object({ message: z.string().trim().min(1).max(2000) });

export const synthesizeSchema = z.object({ text: z.string().trim().min(1).max(2500), language: language.default("en") });

export const progressQuery = z.object({ days: z.coerce.number().int().min(1).max(90).default(7) });
