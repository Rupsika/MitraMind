import { Request, Response } from "express";
import { chatService } from "../services/chatService";

export const chatController = {
  create: async (req: Request, res: Response) =>
    res.status(201).json({ conversation: await chatService.createConversation(req.userId!, req.body) }),
  history: async (req: Request, res: Response) => res.json({ conversations: await chatService.history(req.userId!) }),
  get: async (req: Request, res: Response) => res.json(await chatService.get(req.userId!, req.params.id)),
  send: async (req: Request, res: Response) =>
    res.status(201).json(await chatService.sendMessage(req.userId!, req.params.id, req.body.content, req.body.language)),
  remove: async (req: Request, res: Response) => {
    await chatService.remove(req.userId!, req.params.id);
    res.status(204).end();
  },
};
