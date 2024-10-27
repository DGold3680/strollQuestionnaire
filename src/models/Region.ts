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

regionSchema.pre<RegionDocument>("save", function (next) {
  try {
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

      this.activeCycle = dateManager.getCurrentCycleForRegion(
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

regionSchema.pre<Query<RegionDocument, RegionDocument>>(
  "findOneAndUpdate",
  async function (next) {
    try {
      const update = this.getUpdate() as Partial<RegionDocument>;
      const filter = this.getFilter();

      if (
        !update.timezone &&
        !update.cycleConfig?.cycleDuration &&
        !update.cycleConfig?.startDate
      ) {
        return next();
      }

      const existingDoc = await this.model.findOne(filter);
      if (!existingDoc) {
        return next(new Error("Document not found"));
      }

      const finalTimezone = update.timezone || existingDoc.timezone;
      const finalCycleConfig = {
        cycleDuration:
          update.cycleConfig?.cycleDuration ||
          existingDoc.cycleConfig.cycleDuration,
        startDate:
          update.cycleConfig?.startDate || existingDoc.cycleConfig.startDate,
      };

      const newActiveCycle = dateManager.getCurrentCycleForRegion(
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
