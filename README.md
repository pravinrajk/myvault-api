# my-api

Express API that processes Cosmos DB events and Azure Blob storage events delivered via Azure Service Bus, and persists results to Cosmos DB.

## Requirements

- Node.js 22+
- An Azure Service Bus namespace with a queue (used for both Cosmos event and blob event messages)
- An Azure Cosmos DB account

## Setup

```bash
npm install
cp .env.example .env   # then fill in the values below
```

### Environment variables

| Variable | Description |
| --- | --- |
| `AZURE_SERVICE_BUS_CONNECTION_STRING` | Connection string for the Service Bus namespace |
| `AZURE_SERVICE_BUS_QUEUE_NAME` | Queue used for Cosmos event messages |
| `AZURE_SERVICE_BUS_TOPIC_NAME` | Topic name, if using topic/subscription instead of a queue |
| `AZURE_SERVICE_BUS_SUBSCRIPTION_NAME` | Subscription name, if using topic/subscription |
| `AZURE_SERVICE_BUS_BLOB_QUEUE_NAME` | Queue used for blob storage event messages |
| `COSMOS_DB_CONNECTION_STRING` | Cosmos DB connection string (`AccountEndpoint=...;AccountKey=...;`) |
| `COSMOS_DB_DATABASE_ID` | Cosmos DB database id |
| `COSMOS_DB_CONTAINER_ID` | Cosmos DB container id |
| `PORT` | HTTP port (default `3000`) |

## Development

```bash
npm run dev     # run with live reload
npm run build   # compile TypeScript to dist/
npm start        # run the compiled build
```

## API

- `GET /health` — health check
- `POST /api/cosmos-event` — manually submit a Cosmos event message for processing

On startup, the server also subscribes to Service Bus in the background to process Cosmos events and blob storage events as they arrive.

## Project structure

```
src/
  controller/   # request/message handlers
  interfaces/    # shared TypeScript types
  listeners/     # Service Bus subscriptions
  services/      # Cosmos DB and event processing logic
```

## Docker

```bash
docker build -t my-api .
docker run --env-file .env -p 3000:3000 my-api
```

## Deployment

Pushes to `main` trigger [.github/workflows/deploy.yml](.github/workflows/deploy.yml), which builds the image with Azure Container Registry and updates the Azure Container App.
