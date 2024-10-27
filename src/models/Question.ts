import { Schema, model, Document } from "mongoose";
import { Region } from "./region";

export interface QuestionDocument extends Document {
  _id: Schema.Types.ObjectId;
  content: string;
  region: Schema.Types.ObjectId;
  sequence: number;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<QuestionDocument>(
  {
    content: {
      type: String,
      required: true,
    },
    region: {
      type: Schema.Types.ObjectId,
      ref: "Region",
      required: true,
    },
    sequence: {
      type: Number,
      required: true,
      unique:true
    },
  },
  {
    timestamps: true,
  }
);

export const Question = model<QuestionDocument>("Question", questionSchema);
