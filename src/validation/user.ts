import { body } from "express-validator";
const mongoose = require('mongoose');

export const userValidation = {
  createUser: [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("User name is required")
      .isLength({ min: 2, max: 50 })
      .withMessage("User name must be between 2 and 50 characters"),

    body("regionId")
      .notEmpty()
      .withMessage("Region ID is required")
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error("Invalid region ID");
        }
        return true;
      }),
  ],
};

