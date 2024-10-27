import express, { Request, Response } from "express";
import { userValidation } from "../../validation/user";
import { validate } from "../../middleware/validate";
import { User } from "../../models/user";

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API to manage users
 */
const router = express.Router();

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               regionId:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: "Gold"
 *                 region:
 *                   type: string
 *                   example: "671e29a95f6fed9a257984aa"
 *                 _id:
 *                   type: string
 *                   example: "671e4213e5e9dec8d2d603b9"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-10-27T13:37:23.432Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-10-27T13:37:23.432Z"
 *                 __v:
 *                   type: integer
 *                   example: 0
 *       500:
 *         description: Error creating user
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
 *                   example: "Error creating user"
 */

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
