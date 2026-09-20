export type BlobStorageEventType = "Microsoft.Storage.BlobCreated" | "Microsoft.Storage.BlobDeleted";

export interface BlobStorageEvent {
  topic: string;
  subject: string;
  eventType: BlobStorageEventType;
  id: string;
  data: {
    api: string;
    requestId: string;
    eTag: string;
    contentType: string;
    contentLength: number;
    blobType: string;
    url: string;
    sequencer: string;
    storageDiagnostics?: Record<string, unknown>;
  };
  dataVersion: string;
  metadataVersion: string;
  eventTime: string;
}
