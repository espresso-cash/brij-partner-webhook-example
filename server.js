import express from "express";
import { webhookHandler } from "./webhook-example.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post("/webhook", async (req, res) => {
  try {
    console.log(req.body);
    await webhookHandler(req.body);
    res.status(200).send("Webhook processed successfully");
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Error processing webhook");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
