import type { BlobStorageEvent } from "../interfaces/BlobStorageEvent";
import { upsertItem, deleteItem } from "./CosmosService";

const SUBJECT_PATTERN = /\/containers\/(?<container>[^/]+)\/blobs\/(?<blob>.+)$/;

function parseSubject(subject: string): { container: string; blobName: string } {
  const match = SUBJECT_PATTERN.exec(subject);
  if (!match?.groups) {
    throw new Error(`Unable to parse container/blob from subject "${subject}"`);
  }
  return { container: match.groups.container, blobName: match.groups.blob };
}

export async function processBlobEvent(event: BlobStorageEvent): Promise<void> {
  const { container, blobName } = parseSubject(event.subject);

  switch (event.eventType) {
    case "Microsoft.Storage.BlobCreated":
      await upsertItem({
        id: blobName,
        partitionKey: container,
        url: event.data.url,
        contentType: event.data.contentType,
        contentLength: event.data.contentLength,
        eTag: event.data.eTag,
        blobType: event.data.blobType,
        updatedAt: event.eventTime,
      });
      break;
    case "Microsoft.Storage.BlobDeleted":
      await deleteItem(blobName, container);
      break;
    default:
      throw new Error(`Unknown blob event type "${event.eventType}"`);
  }
}
