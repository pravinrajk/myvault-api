import type { CosmosEventMessage } from "../interfaces/CosmosEventMessage";
import { upsertItem, deleteItem } from "./CosmosService";

export async function processCosmosEvent(body: CosmosEventMessage): Promise<void> {
  switch (body.action) {
    case "insert":
      if (!body.data) {
        throw new Error(`Missing data for insert action on item "${body.id}"`);
      }
      await upsertItem({ id: body.id, partitionKey: body.partitionKey, ...body.data });
      break;
    case "delete":
      await deleteItem(body.id, body.partitionKey);
      break;
    default:
      throw new Error(`Unknown action "${body.action}" for item "${body.id}"`);
  }
}
