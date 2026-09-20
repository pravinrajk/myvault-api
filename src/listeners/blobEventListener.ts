import { ServiceBusClient, type ServiceBusReceivedMessage, type ProcessErrorArgs } from "@azure/service-bus";
import { blobEventController } from "../controller/BlobEventController";

const connectionString = process.env.AZURE_SERVICE_BUS_CONNECTION_STRING ?? "";
const queueName = process.env.AZURE_SERVICE_BUS_BLOB_QUEUE_NAME ?? "";

export async function startBlobEventListener(): Promise<void> {
  const sbClient = new ServiceBusClient(connectionString);
  const receiver = sbClient.createReceiver(queueName);

  receiver.subscribe({
    processMessage: async (message: ServiceBusReceivedMessage) => {
      await blobEventController.handleServiceBusMessage(message);
      await receiver.completeMessage(message);
    },
    processError: async (args: ProcessErrorArgs) => {
      console.error(`Service Bus error on "${args.entityPath}":`, args.error);
    },
  });

  console.log(`Listening for blob storage events on queue "${queueName}"`);
}
