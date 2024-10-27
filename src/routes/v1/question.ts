import express, { Request, Response } from "express";
import { questionValidation } from "../../validation/question";
import { validate } from "../../middleware/validate";
import { Question, QuestionDocument } from "../../models/question";
import { User } from "../../models/user";
import { Region } from "../../models/region";
import { dateManager } from "../../utils/dateManager";
import { redisClient } from "../../config/redisCache";

const router = express.Router();

router.post(
  "/",
  validate(questionValidation.createQuestion),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { content, regionId, sequence } = req.body;

      const question = await Question.create({
        content,
        region: regionId,
        sequence,
      });

      await redisClient.del(`regionQuestion:${regionId}`);

      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(500).json({ message: "Error creating question" });
    }
  }
);

router.get("/:userId", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const region = await Region.findById(user.region);
    if (!region) {
      res.status(404).json({ message: "User's Region not found" });
      return;
    }

    let attempts = 0;
    while (await redisClient.get(`regionQuestion:${region._id}:in-transition`)) {
      if (attempts >= 5) {
        res.status(503).json({ message: "Please try again in a moment" });
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    let question: QuestionDocument | undefined;

    let questionFromRedis = await redisClient.get(
      `regionQuestion:${region._id}`
    );
    if (questionFromRedis) {
      question = JSON.parse(questionFromRedis) as QuestionDocument | undefined;
    } else {
      const questions = await Question.find({
        region: region._id,
      });

      const questionIndex = (region.activeCycle - 1) % questions.length;
      question = questions[questionIndex];

      const nextTransitionDate = dateManager.getNextCycleDate(
        region.cycleConfig.startDate,
        region.activeCycle,
        region.cycleConfig.cycleDuration,
        region.timezone
      );
      const ttl = Math.max(
        1,
        Math.floor((nextTransitionDate.valueOf() - new Date().getTime()) / 1000)
      );

      await redisClient.set(
        `regionQuestion:${region._id}`,
        JSON.stringify(question),
        { EX: ttl }
      );
    }
    res.status(200).json(question);
  } catch (error) {
    console.error("Error getting question:", error);
    res.status(500).json({ message: "Error getting question" });
  }
});

export const questionRoutes = router;
