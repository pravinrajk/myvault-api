import type { ServiceBusReceivedMessage } from "@azure/service-bus";
import type { BlobStorageEvent } from "../interfaces/BlobStorageEvent";
import { processBlobEvent } from "../services/BlobEventService";

export class BlobEventController {
  async handleServiceBusMessage(message: ServiceBusReceivedMessage): Promise<void> {
    const body = message.body as BlobStorageEvent;
    await processBlobEvent(body);
  }
}

export const blobEventController = new BlobEventController();
