import express from "express";
import apiRouter from "../src/server/api.ts";

const app = express();

app.use(express.json({ limit: '50mb' }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", environment: "vercel" });
});

// API Routes
app.use("/api", apiRouter);

export default app;
