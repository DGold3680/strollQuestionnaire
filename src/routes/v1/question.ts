import express, { Request, Response } from "express";
import { questionValidation } from "../../validation/question";
import { validate } from "../../middleware/validate";
import { Question, QuestionDocument } from "../../models/question";
import { User } from "../../models/user";
import { Region } from "../../models/region";
import { dateManager } from "../../utils/dateManager";
import { redisClient } from "../../config/redisCache";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Questions
 *   description: API to manage questions
 */

/**
 * @swagger
 * /questions:
 *   post:
 *     summary: Create a new question
 *     tags: [Questions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Who is our favorite artiste?"
 *               regionId:
 *                 type: string
 *                 example: "671e29a95f6fed9a257984aa"
 *               sequence:
 *                 type: integer
 *                 example: 12
 *     responses:
 *       201:
 *         description: Question created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "671e41cde5e9dec8d2d603b6"
 *                 content:
 *                   type: string
 *                   example: "Who is our favorite artiste?"
 *                 region:
 *                   type: string
 *                   example: "671e29a95f6fed9a257984aa"
 *                 sequence:
 *                   type: integer
 *                   example: 12
 *                 __v:
 *                   type: integer
 *                   example: 0
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-10-27T13:36:13.740Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-10-27T13:36:13.740Z"
 *       500:
 *         description: Error creating question
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Error creating question"
 */
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

/**
 * @swagger
 * /questions/{userId}:
 *   get:
 *     summary: Get the correct question for a user based on their region and the current cycle
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved question
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "671e29ab5f6fed9a257984ba"
 *                 content:
 *                   type: string
 *                   example: "What is your favorite local dish?"
 *                 region:
 *                   type: string
 *                   example: "671e29a95f6fed9a257984aa"
 *                 sequence:
 *                   type: integer
 *                   example: 1
 *                 __v:
 *                   type: integer
 *                   example: 0
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-10-27T11:53:15.534Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-10-27T11:53:15.534Z"
 *       404:
 *         description: User or region not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "User or region not found"
 *       500:
 *         description: Error getting question
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Error getting question"
 */
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

    const isInTransition = await redisClient.get(
      `regionQuestion:${region._id}:in-transition`
    );
    if (isInTransition) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const stillInTransition = await redisClient.get(
        `regionQuestion:${region._id}:in-transition`
      );
      if (stillInTransition) {
        res.status(503).json({ message: "Please try again in a moment" });
        return;
      }
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
