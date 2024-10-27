import { Schema, model, Document } from "mongoose";
import { Region } from "./region";

export interface UserDocument extends Document {
  _id: Schema.Types.ObjectId;
  name: string;
  region: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    region: {
      type: Schema.Types.ObjectId,
      ref: "Region",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const User = model<UserDocument>("User", userSchema);
