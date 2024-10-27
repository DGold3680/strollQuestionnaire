import dotenv from "dotenv";
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { connectDB } from "./config/connectDb";
import { connectCache, redisClient } from "./config/redisCache";
import { v1Routes } from "./routes/v1/index";
import swaggerUi from "swagger-ui-express";
import { swaggerDocs } from "./config/swagger";
import { initializeJobs } from "./agendas/questionCyclingAgenda";

const app = express();

app.use(cors());
app.use(express.json());

const connectAllDbs = async () => {
  try {
    await connectDB();
    await connectCache();
    await initializeJobs();
  } catch (error) {
    console.error("Failed to connect to databases or initialize jobs:", error);
  }
};

connectAllDbs().then(() => {
  const limiter = rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: "rate-limit:",
    }),
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
      status: "error",
      message: "Too many requests, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(limiter);

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  app.use(`/api/${process.env.API_VERSION}`, v1Routes);

  app.get("/", (req: Request, res: Response) => {
    res.json({ message: "Question Rotation System API" });
  });

  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal Server Error" });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
