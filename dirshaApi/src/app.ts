import { env } from "./config/env";
import express from "express";
import cors from "cors";
import http from "node:http";

import { authRouter } from "./routes/auth/auth.routes";
import { kycRouter } from "./routes/kyc/kyc.routes";
import { walletRouter } from "./routes/wallet/wallet.routes";
import { fundingRouter } from "./routes/funding/funding.routes";
import { assetsRouter } from "./routes/assets/assets.routes";
import { basketsRouter } from "./routes/baskets/baskets.routes";
import {
  marketRouter,
  ordersRouter,
  portfolioRouter,
} from "./routes/market/market.routes";
import { yieldRouter, adminRouter } from "./routes/yield/yield.routes";
import { globalErrorHandler } from "./middleware/globalErrorHandler";
import { ApiError } from "./utils/ApiError";
import { assertDatabaseConnection } from "./database/database.config";
import { realtimeHub } from "./realtime/hub";
import { startBackgroundJobs, stopBackgroundJobs } from "./jobs";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigin.split(",").map((o) => o.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "10mb" })); // Base64 selfies for eKYC are large.

  app.get("/api/v1/health", (_req, res) => {
    res.json({
      success: true,
      status: "UP",
      mode: env.partnerMode,
      realtime_clients: realtimeHub.connectionCount,
    });
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/kyc", kycRouter);
  app.use("/api/v1/wallet", walletRouter);
  app.use("/api/v1/funding-sources", fundingRouter);
  app.use("/api/v1/assets", assetsRouter);
  app.use("/api/v1/baskets", basketsRouter);
  app.use("/api/v1/market", marketRouter);
  app.use("/api/v1/orders", ordersRouter);
  app.use("/api/v1/portfolio", portfolioRouter);
  app.use("/api/v1/yield", yieldRouter);
  app.use("/api/v1/admin", adminRouter);

  app.use((req, _res, next) => {
    next(
      ApiError.notFound("ROUTE_NOT_FOUND", `No route matches ${req.method} ${req.path}`),
    );
  });

  app.use(globalErrorHandler);

  return app;
}

async function start() {
  try {
    await assertDatabaseConnection();
    console.log(`[db] connected to ${env.db.database} at ${env.db.host}:${env.db.port}`);
  } catch (error) {
    console.error(
      `[db] connection failed. Is MySQL/MariaDB running and does "${env.db.database}" exist?`,
    );
    console.error(error);
    process.exit(1);
  }

  const app = createApp();
  const server = http.createServer(app);

  realtimeHub.attach(server, "/ws");
  startBackgroundJobs();

  server.listen(env.port, () => {
    console.log(`[api] listening on http://localhost:${env.port} (${env.partnerMode} partners)`);
    console.log(`[ws]  market feed on ws://localhost:${env.port}/ws`);
  });

  const shutdown = () => {
    stopBackgroundJobs();
    realtimeHub.close();
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

if (require.main === module) {
  void start();
}
