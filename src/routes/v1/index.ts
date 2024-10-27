import express from "express";
import { regionRoutes } from "./region";
import { questionRoutes } from "./question";
import { userRoutes } from "./user";

const router = express.Router();

router.use("/regions", regionRoutes);
router.use("/questions", questionRoutes);
router.use("/users", userRoutes);

export const v1Routes = router