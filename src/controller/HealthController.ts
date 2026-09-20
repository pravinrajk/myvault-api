import type { Request, Response } from "express";

export class HealthController {
  getHealth = (_req: Request, res: Response): void => {
    res.json({ status: "ok" });
  };
}

export const healthController = new HealthController();
