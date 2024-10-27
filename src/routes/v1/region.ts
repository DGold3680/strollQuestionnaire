import express, { Request, Response } from "express";
import { regionValidation } from "../../validation/region";
import { validate } from "../../middleware/validate";
import { Region } from "../../models/region";
import { dayTimeZone } from "../../config/dayjsConfig";

const router = express.Router();
const StartDate = dayTimeZone()
  .tz("Asia/Singapore")
  .set("hour", 19)
  .set("minute", 0)
  .set("second", 0)
  .format();

router.get("/:regionId", async (req: Request, res: Response): Promise<void> => {
  try {
    const region = await Region.findById(req.params.regionId);

    res.status(200).json({...region.toObject(),currentCycle:region.currentCycle});
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

      const updatedRegion = await Region.updateOne(
        { _id: regionId },
        {
          $set: {
            "cycleConfig.cycleDuration": cycleDuration,
          },
        }
      );

      if (updatedRegion.modifiedCount === 0) {
        res.status(404).json({ message: "Region not found" });
        return;
      }
      res.status(200).json(updatedRegion);
    } catch (error) {
      console.error("Error creating region:", error);
      res.status(500).json({ message: "Error creating region" });
    }
  }
);

export const regionRoutes = router;
