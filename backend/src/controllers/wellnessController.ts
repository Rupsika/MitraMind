import { Request, Response } from "express";
import { AppError } from "../utils/errors";
import { aiClient } from "../services/aiClient";
import { authService } from "../services/authService";
import { checkinService } from "../services/checkinService";
import { progressService } from "../services/progressService";
import { recommendationService } from "../services/recommendationService";
import { resourceService } from "../services/resourceService";

export const checkinController = {
  create: async (req: Request, res: Response) =>
    res.status(201).json({ checkin: await checkinService.create(req.userId!, req.body) }),
  list: async (req: Request, res: Response) => res.json({ checkins: await checkinService.list(req.userId!) }),
  summary: async (req: Request, res: Response) => res.json(await checkinService.summary(req.userId!)),
};

export const resourceController = {
  list: async (req: Request, res: Response) =>
    res.json({ resources: await resourceService.list(req.query as { category?: string; language?: string }) }),
  get: async (req: Request, res: Response) => res.json({ resource: await resourceService.get(req.params.id) }),
  start: async (req: Request, res: Response) =>
    res.status(201).json({ progress: await resourceService.start(req.userId!, req.params.id) }),
  complete: async (req: Request, res: Response) =>
    res.json({ progress: await resourceService.complete(req.userId!, req.params.id) }),
};

export const progressController = {
  get: async (req: Request, res: Response) => res.json(await progressService.get(req.userId!, Number(req.query.days))),
};

export const recommendationController = {
  list: async (req: Request, res: Response) => {
    const user = await authService.me(req.userId!);
    const results = await recommendationService.forUser(user.id, user.preferredLanguage);
    res.json({ recommendations: results });
  },
};

export const voiceController = {
  transcribe: async (req: Request, res: Response) => {
    if (!req.file) throw new AppError(400, "Audio file is required", "validation_error");
    const language = ["en", "hi", "te", "ta"].includes(req.body?.language) ? req.body.language : "en";
    const out = await aiClient.transcribe(req.file.buffer, req.file.originalname || "audio.wav", req.file.mimetype, language);
    res.json(out);
  },
  synthesize: async (req: Request, res: Response) => {
    const audio = await aiClient.synthesize(req.body.text, req.body.language);
    res.type("audio/wav").send(audio);
  },
};

export const safetyController = {
  analyze: async (req: Request, res: Response) => res.json(await aiClient.analyzeSafety(req.body.message)),
};
