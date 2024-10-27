import { body } from "express-validator";

export const regionValidation = {
  createRegion: [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Region name is required")
      .isLength({ min: 2, max: 50 })
      .withMessage("Region name must be between 2 and 50 characters"),

    body("timezone")
      .trim()
      .notEmpty()
      .withMessage("Timezone is required")
      .custom((value) => {
        try {
          new Intl.DateTimeFormat("en-US", { timeZone: value });
        } catch (e) {
          throw new Error("Invalid timezone");
        }
        return true;
      }),
    body("cycleDuration")
      .isInt({ min: 1, max: 365 })
      .withMessage("Cycle duration must be between 1 and 365 days"),
  ],

  updateRegion: [
    body("cycleDuration")
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage("Cycle duration must be between 1 and 365 days"),
  ],
};
