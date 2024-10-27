import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

import { connectDB } from "./config/connectDb";
import { v1Routes } from "./routes/v1/index";
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(`/api/${process.env.API_VERSION}`, v1Routes);
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Question Rotation System API" });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

const startServer = async () => {
  await connectDB();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
