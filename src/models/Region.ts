import { Schema, model, Document, Query } from "mongoose";
import { dayTimeZone } from "../config/dayjsConfig";
import { dateManager } from "../utils/dateManager";

export interface RegionDocument extends Document {
  _id: Schema.Types.ObjectId;
  name: string;
  timezone: string;
  cycleConfig: {
    cycleDuration: number;
    startDate: Date;
  };
  activeCycle: number;
  createdAt: Date;
  updatedAt: Date;
  currentCycle: number;
}

const regionSchema = new Schema<RegionDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    timezone: {
      type: String,
      required: true,
    },
    cycleConfig: {
      cycleDuration: {
        type: Number,
        required: true,
        min: 1,
        max: 365,
        default: 7,
      },
      startDate: {
        type: Date,
        required: true,
        default: function () {
          const userTimezone = this.timezone || "Asia/Singapore";
          const dayTime = dayTimeZone()
            .tz(userTimezone)
            .set("hour", Number(process.env.DEFAULT_START_HOUR))
            .set("minute", 0)
            .set("second", 0)
            .toDate();
          return dayTime;
        },
      },
    },
    activeCycle: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

const calculateActiveCycle = (
  startDate: Date,
  cycleDuration: number,
  timezone: string
): number => {
  if (!startDate || !cycleDuration || !timezone) {
    throw new Error("Missing required parameters for calculating active cycle");
  }

  const now = dayTimeZone().tz(timezone);
  const start = startDate;

  if (now.isBefore(start)) {
    return 1;
  }

  const daysElapsed = now.diff(start, "days");
  return Math.floor(daysElapsed / cycleDuration) + 1;
};

// Pre-save hook with improved error handling
regionSchema.pre<RegionDocument>("save", function (next) {
  try {
    // Check if this is a new document or if relevant fields were modified
    if (
      this.isNew ||
      this.isModified("timezone") ||
      this.isModified("cycleConfig.cycleDuration") ||
      this.isModified("cycleConfig.startDate")
    ) {
      if (
        !this.timezone ||
        !this.cycleConfig?.cycleDuration ||
        !this.cycleConfig?.startDate
      ) {
        return next(
          new Error(
            "Timezone and Cycle Config (duration and start date) are required to calculate active cycle"
          )
        );
      }

      this.activeCycle = calculateActiveCycle(
        this.cycleConfig.startDate,
        this.cycleConfig.cycleDuration,
        this.timezone
      );
    }
    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error(String(error)));
  }
});

regionSchema.virtual("currentCycle").get(function () {
  return dateManager.getCurrentCycleForRegion(
    this.cycleConfig.startDate,
    this.cycleConfig.cycleDuration,
    this.timezone
  );
});

// Pre-findOneAndUpdate hook with improved error handling and type safety
regionSchema.pre<Query<RegionDocument, RegionDocument>>(
  "findOneAndUpdate",
  async function (next) {
    try {
      const update = this.getUpdate() as Partial<RegionDocument>;
      const filter = this.getFilter();

      // Only proceed if relevant fields are being updated
      if (
        !update.timezone &&
        !update.cycleConfig?.cycleDuration &&
        !update.cycleConfig?.startDate
      ) {
        return next();
      }

      // Fetch existing document
      const existingDoc = await this.model.findOne(filter);
      if (!existingDoc) {
        return next(new Error("Document not found"));
      }

      // Merge existing and updated values
      const finalTimezone = update.timezone || existingDoc.timezone;
      const finalCycleConfig = {
        cycleDuration:
          update.cycleConfig?.cycleDuration ||
          existingDoc.cycleConfig.cycleDuration,
        startDate:
          update.cycleConfig?.startDate || existingDoc.cycleConfig.startDate,
      };

      // Calculate and set new active cycle
      const newActiveCycle = calculateActiveCycle(
        finalCycleConfig.startDate,
        finalCycleConfig.cycleDuration,
        finalTimezone
      );

      this.set("activeCycle", newActiveCycle);
      next();
    } catch (error) {
      next(error instanceof Error ? error : new Error(String(error)));
    }
  }
);

export const Region = model<RegionDocument>("Region", regionSchema);
