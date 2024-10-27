import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

import { connectDB } from "./dbConfig/connectDb";
import { User } from "./models/User";
import { Region } from "./models/Region";
import { dateManger } from "./utils/dateManager";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Question Rotation System API" });
});

app.get(
  "/api/question/:userId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await User.findById(req.params.userId).populate("region");
      if (!user) {
        res.status(404).json({ message: "User not found" });
      }

      const region = await Region.findById(user.region).populate("questions");
      const currentCycle = dateManger.getCurrentCycleForRegion(
        region.cycleConfig.startDate,
        region.cycleConfig.cycleDuration,
        region.timezone
      );

      const questionIndex = (currentCycle - 1) % region.questions.length;
      const question = region.questions[questionIndex];

      res.json({
        cycle: currentCycle,
        question: question,
      });
    } catch (error) {
      console.error("Error getting question:", error);
      res.status(500).json({ message: "Error getting question" });
    }
  }
);

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
