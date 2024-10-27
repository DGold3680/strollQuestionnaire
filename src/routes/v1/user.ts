import express, { Request, Response } from "express";
import { userValidation } from "../../validation/user";
import { validate } from "../../middleware/validate";
import { User } from "../../models/user";

const router = express.Router();

router.post(
  "/",
  validate(userValidation.createUser),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, regionId } = req.body;

      const user = await User.create({
        name,
        region: regionId,
      });

      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Error creating user" });
    }
  }
);

export const userRoutes = router;
