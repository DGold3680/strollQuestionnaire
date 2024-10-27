import { Schema, model, Document } from "mongoose";
import { dayTimeZone } from "../config/dayjsConfig"

export interface RegionDocument extends Document {
  _id: Schema.Types.ObjectId;
  name: string;
  timezone: string;
  cycleConfig: {
    cycleDuration: number;
    startDate: Date;
  };
  activeCycle: number;
  questions: Schema.Types.ObjectId[];
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
        default: 7, // 7 days default
      },
      startDate: {
        type: Date,
        required: true,
        default: () => {
          return dayTimeZone
            .tz("Asia/Singapore")
            .set("hour", 19)
            .set("minute", 0)
            .set("second", 0)
            .toDate();
        },
      },
    },
    activeCycle: {
      type: Number,
      required: true,
      default: 1,
    },
    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Region = model("Region", regionSchema);
