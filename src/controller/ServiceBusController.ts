import type { ServiceBusReceivedMessage } from "@azure/service-bus";
import type { Request, Response } from "express";
import type { CosmosEventMessage } from "../interfaces/CosmosEventMessage";
import { processCosmosEvent } from "../services/CosmosEventService";

export class ServiceBusController {
  async handleServiceBusMessage(message: ServiceBusReceivedMessage): Promise<void> {
    const body = message.body as CosmosEventMessage;
    await processCosmosEvent(body);
  }

  handleCosmosEventRequest = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as CosmosEventMessage;

    try {
      await processCosmosEvent(body);
      res.status(200).json({ status: "ok" });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  };
}

export const serviceBusController = new ServiceBusController();
