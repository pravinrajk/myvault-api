export interface CosmosEventMessage {
  action: "insert" | "delete";
  id: string;
  partitionKey: string;
  data?: Record<string, unknown>;
}
