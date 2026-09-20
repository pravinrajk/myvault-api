import { CosmosClient, type Container } from "@azure/cosmos";

const connectionString = process.env.COSMOS_DB_CONNECTION_STRING ?? "";
const databaseId = process.env.COSMOS_DB_DATABASE_ID ?? "";
const containerId = process.env.COSMOS_DB_CONTAINER_ID ?? "";

const cosmosClient = new CosmosClient(connectionString);
const container: Container = cosmosClient.database(databaseId).container(containerId);

export async function upsertItem(item: Record<string, unknown>): Promise<void> {
  await container.items.upsert(item);
}

export async function deleteItem(id: string, partitionKey: string): Promise<void> {
  await container.item(id, partitionKey).delete();
}
