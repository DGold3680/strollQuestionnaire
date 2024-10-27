import express, { Request, Response } from "express";
import { regionValidation } from "../../validation/region";
import { validate } from "../../middleware/validate";
import { Region } from "../../models/region";
import { dayTimeZone } from "../../config/dayjsConfig";
import { dateManager } from "../../utils/dateManager";
import { scheduleNextTransition } from "../../agendas/questionCyclingAgenda";
import { redisClient } from "../../config/redisCache";

/**
 * @swagger
 * tags:
 *   name: Regions
 *   description: API to manage regions
 */
const router = express.Router();


/**
 * @swagger
 * /regions/{regionId}:
 *   get:
 *     summary: Get a region by ID
 *     tags: [Regions]
 *     parameters:
 *       - in: path
 *         name: regionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved region
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cycleConfig:
 *                   type: object
 *                   properties:
 *                     cycleDuration:
 *                       type: integer
 *                       example: 7
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-10-27T11:53:13.154Z"
 *                 _id:
 *                   type: string
 *                   example: "671e29a95f6fed9a257984aa"
 *                 name:
 *                   type: string
 *                   example: "Singapore"
 *                 timezone:
 *                   type: string
 *                   example: "Asia/Singapore"
 *                 activeCycle:
 *                   type: integer
 *                   example: 1
 *                 __v:
 *                   type: integer
 *                   example: 0
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-10-27T11:53:13.206Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-10-27T11:53:13.206Z"
 *       500:
 *         description: Error fetching region
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
 *                   example: "Error fetching region"
 */

router.get("/:regionId", async (req: Request, res: Response): Promise<void> => {
  try {
    const region = await Region.findById(req.params.regionId);

    res.status(200).json(region);
  } catch (error) {
    console.error("Error fetching region:", error);
    res.status(500).json({ message: "Error fetching region" });
  }
});



/**
 * @swagger
 * /regions:
 *   post:
 *     summary: Create a new region
 *     tags: [Regions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               timezone:
 *                 type: string
 *               cycleDuration:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Region created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: "Nigeria"
 *                 timezone:
 *                   type: string
 *                   example: "Africa/Lagos"
 *                 cycleConfig:
 *                   type: object
 *                   properties:
 *                     cycleDuration:
 *                       type: integer
 *                       example: 28
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-10-27T18:00:00.814Z"
 *                 activeCycle:
 *                   type: integer
 *                   example: 1
 *                 _id:
 *                   type: string
 *                   example: "671e5b0c24fd73eabf0679ef"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-10-27T15:23:56.832Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-10-27T15:23:56.832Z"
 *                 __v:
 *                   type: integer
 *                   example: 0
 *       500:
 *         description: Error creating region
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
 *                   example: "Error creating region"
 */


router.post(
  "/",
  validate(regionValidation.createRegion),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, timezone, cycleDuration } = req.body;

      const region = await Region.create({
        name,
        timezone,
        cycleConfig: {
          cycleDuration,
        },
      });

      const startDate = dayTimeZone()
        .tz(timezone)
        .set("hour", 19)
        .set("minute", 0)
        .set("second", 0)
        .toDate();

      const nextTransitionDate = dateManager.getNextCycleDate(
        startDate,
        1,
        cycleDuration,
        timezone
      );

      await scheduleNextTransition(region._id, nextTransitionDate);
      res.status(201).json(region);
    } catch (error) {
      console.error("Error creating region:", error);
      res.status(500).json({ message: "Error creating region" });
    }
  }
);



/**
 * @swagger
 * /regions:
 *   patch:
 *     summary: Update a region cycle duration
 *     tags: [Regions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cycleDuration:
 *                 type: integer
 *     responses:
 *       200:  # Updated status code for successful update
 *         description: Region updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cycleConfig:
 *                   type: object
 *                   properties:
 *                     cycleDuration:
 *                       type: integer
 *                       example: 30
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-10-27T18:00:00.814Z"
 *                 _id:
 *                   type: string
 *                   example: "671e5b0c24fd73eabf0679ef"
 *                 name:
 *                   type: string
 *                   example: "Nigeria"
 *                 timezone:
 *                   type: string
 *                   example: "Africa/Lagos"
 *                 activeCycle:
 *                   type: integer
 *                   example: 1
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-10-27T15:23:56.832Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-10-27T16:09:19.473Z"
 *                 __v:
 *                   type: integer
 *                   example: 0
 *       500:
 *         description: Error updating region
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
 *                   example: "Error updating region"
 */

router.patch(
  "/:regionId",
  validate(regionValidation.updateRegion),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { regionId } = req.params;
      const { cycleDuration } = req.body;

      const updatedRegion = await Region.findByIdAndUpdate(
        regionId,
        { "cycleConfig.cycleDuration": cycleDuration },
        { new: true }
      );

      if (!updatedRegion) {
        res.status(404).json({ message: "Region not found" });
        return;
      }

      await redisClient.del(`regionQuestion:${updatedRegion._id}`);

      const nextTransitionDate = dateManager.getNextCycleDate(
        updatedRegion.cycleConfig.startDate,
        updatedRegion.activeCycle,
        updatedRegion.cycleConfig.cycleDuration,
        updatedRegion.timezone
      );
      await scheduleNextTransition(updatedRegion._id, nextTransitionDate);

      res.status(200).json(updatedRegion);
    } catch (error) {
      console.error("Error updating region:", error);
      res.status(500).json({ message: "Error updating region" });
    }
  }
);

export const regionRoutes = router;
