import { ServiceBusClient, type ServiceBusReceivedMessage, type ProcessErrorArgs } from "@azure/service-bus";
import { serviceBusController } from "../controller/ServiceBusController";

const connectionString = process.env.AZURE_SERVICE_BUS_CONNECTION_STRING ?? "";
const queueName = process.env.AZURE_SERVICE_BUS_QUEUE_NAME ?? "";
// const topicName = process.env.AZURE_SERVICE_BUS_TOPIC_NAME ?? "";
// const subscriptionName = process.env.AZURE_SERVICE_BUS_SUBSCRIPTION_NAME ?? "";

export async function startServiceBusListener(): Promise<void> {
  const sbClient = new ServiceBusClient(connectionString);
  const receiver = sbClient.createReceiver(queueName);

  receiver.subscribe({
    processMessage: async (message: ServiceBusReceivedMessage) => {
      await serviceBusController.handleServiceBusMessage(message);
      await receiver.completeMessage(message);
    },
    processError: async (args: ProcessErrorArgs) => {
      console.error(`Service Bus error on "${args.entityPath}":`, args.error);
    },
  });

  console.log(`Listening for Service Bus messages on queue "${queueName}"`);
}

// export async function startServiceBusTopicListener(): Promise<void> {
//   const sbClient = new ServiceBusClient(connectionString);
//   const receiver = sbClient.createReceiver(topicName, subscriptionName);

//   receiver.subscribe({
//     processMessage: async (message: ServiceBusReceivedMessage) => {
//       await serviceBusController.handleServiceBusMessage(message);
//       await receiver.completeMessage(message);
//     },
//     processError: async (args: ProcessErrorArgs) => {
//       console.error(`Service Bus error on "${args.entityPath}":`, args.error);
//     },
//   });

//   console.log(`Listening for Service Bus messages on topic "${topicName}", subscription "${subscriptionName}"`);
// }
