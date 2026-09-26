import { Request, Response } from "express";
import { authService } from "../services/authService";

export const authController = {
  register: async (req: Request, res: Response) => res.status(201).json(await authService.register(req.body)),
  login: async (req: Request, res: Response) => res.json(await authService.login(req.body.email, req.body.password)),
  me: async (req: Request, res: Response) => res.json({ user: await authService.me(req.userId!) }),
  // JWTs are stateless: logout tells the client to discard its token.
  logout: async (_req: Request, res: Response) => res.json({ ok: true }),
  updateProfile: async (req: Request, res: Response) =>
    res.json({ user: await authService.updateProfile(req.userId!, req.body) }),
};
