import express, { Request, Response } from "express";
import { questionValidation } from "../../validation/question";
import { validate } from "../../middleware/validate";
import { Question } from "../../models/question";
import { User } from "../../models/user";
import { Region } from "../../models/region";
import { dateManager } from "../../utils/dateManager";

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

      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(500).json({ message: "Error creating question" });
    }
  }
);

// Update getQuestion route to use caching
router.get(
  "/:userId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await User.findById(req.params.userId).populate("region");
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const region = await Region.findById(user.region);
      if (!region) {
        res.status(404).json({ message: "User's Region not found" });
        return;
      }

      const questions = await Question.find({
        region: region._id,
      });

      const questionIndex = (region.currentCycle - 1) % questions.length;
      const question = questions[questionIndex];

      res.status(200).json({
        question: question,
      });
    } catch (error) {
      console.error("Error getting question:", error);
      res.status(500).json({ message: "Error getting question" });
    }
  }
);

export const questionRoutes = router