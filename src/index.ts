import "dotenv/config";
import express from "express";
import { startServiceBusListener } from "./listeners/serviceBusListener";
import { startBlobEventListener } from "./listeners/blobEventListener";
import { serviceBusController } from "./controller/ServiceBusController";
import { healthController } from "./controller/HealthController";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", healthController.getHealth);
app.post("/api/cosmos-event", serviceBusController.handleCosmosEventRequest);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// startServiceBusListener().catch((err) => {
//   console.error("Failed to start Service Bus listener:", err);
// });

startBlobEventListener().catch((err) => {
  console.error("Failed to start blob event listener:", err);
});
