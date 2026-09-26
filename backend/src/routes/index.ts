import { Router } from "express";
import multer from "multer";
import { authController } from "../controllers/authController";
import { chatController } from "../controllers/chatController";
import {
  checkinController,
  progressController,
  recommendationController,
  resourceController,
  safetyController,
  voiceController,
} from "../controllers/wellnessController";
import { requireAuth } from "../middleware/auth";
import { aiLimiter, authLimiter } from "../middleware/rateLimit";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/errors";
import {
  checkinSchema,
  createConversationSchema,
  idParam,
  loginSchema,
  progressQuery,
  registerSchema,
  resourceQuery,
  safetyAnalyzeSchema,
  sendMessageSchema,
  synthesizeSchema,
  updateProfileSchema,
} from "../validators";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } });
const h = asyncHandler;

export function buildRouter(): Router {
  const r = Router();
  const auth = authLimiter();
  const ai = aiLimiter();

  // Auth
  r.post("/auth/register", auth, validate(registerSchema), h(authController.register));
  r.post("/auth/login", auth, validate(loginSchema), h(authController.login));
  r.get("/auth/me", requireAuth, h(authController.me));
  r.post("/auth/logout", requireAuth, h(authController.logout));
  r.patch("/auth/me", requireAuth, validate(updateProfileSchema), h(authController.updateProfile));

  // Chat
  r.post("/chat/conversations", requireAuth, validate(createConversationSchema), h(chatController.create));
  r.get("/chat/history", requireAuth, h(chatController.history));
  r.get("/chat/:id", requireAuth, validate(idParam, "params"), h(chatController.get));
  r.post("/chat/:id/messages", requireAuth, ai, validate(idParam, "params"), validate(sendMessageSchema), h(chatController.send));
  r.delete("/chat/:id", requireAuth, validate(idParam, "params"), h(chatController.remove));

  // Check-ins
  r.post("/checkins", requireAuth, validate(checkinSchema), h(checkinController.create));
  r.get("/checkins/summary", requireAuth, h(checkinController.summary));
  r.get("/checkins", requireAuth, h(checkinController.list));

  // Resources
  r.get("/resources", requireAuth, validate(resourceQuery, "query"), h(resourceController.list));
  r.get("/resources/:id", requireAuth, validate(idParam, "params"), h(resourceController.get));
  r.post("/resources/:id/start", requireAuth, validate(idParam, "params"), h(resourceController.start));
  r.post("/resources/:id/complete", requireAuth, validate(idParam, "params"), h(resourceController.complete));

  // Progress + recommendations
  r.get("/progress", requireAuth, validate(progressQuery, "query"), h(progressController.get));
  r.get("/recommendations", requireAuth, h(recommendationController.list));

  // Voice + safety (proxy to AI service)
  r.post("/voice/transcribe", requireAuth, ai, upload.single("file"), h(voiceController.transcribe));
  r.post("/voice/synthesize", requireAuth, ai, validate(synthesizeSchema), h(voiceController.synthesize));
  r.post("/safety/analyze", requireAuth, ai, validate(safetyAnalyzeSchema), h(safetyController.analyze));

  return r;
}
