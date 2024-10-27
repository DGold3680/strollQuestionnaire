import { body } from "express-validator";
const mongoose = require('mongoose');

export const questionValidation = {
  createQuestion: [
    body("content")
      .trim()
      .notEmpty()
      .withMessage("Question content is required")
      .isLength({ min: 10, max: 1000 })
      .withMessage("Question content must be between 10 and 1000 characters"),

    body("regionId")
      .notEmpty()
      .withMessage("Region ID is required")
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error("Invalid region ID");
        }
        return true;
      }),

    body("sequence")
      .isInt({ min: 1 })
      .withMessage("Sequence must be a positive integer"),
  ],
};


