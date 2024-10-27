import express, { Request, Response } from "express";
import { regionValidation } from "../../validation/region";
import { validate } from "../../middleware/validate";
import { Region } from "../../models/region";
import { dayTimeZone } from "../../config/dayjsConfig";
import { dateManager } from "../../utils/dateManager";
import { scheduleNextTransition } from "../../agendas/questionCyclingAgenda";
import { redisClient } from "../../config/redisCache";

const router = express.Router();

router.get("/:regionId", async (req: Request, res: Response): Promise<void> => {
  try {
    const region = await Region.findById(req.params.regionId);

    res.status(200).json(region);
  } catch (error) {
    console.error("Error fetching region:", error);
    res.status(500).json({ message: "Error fetching region" });
  }
});

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
