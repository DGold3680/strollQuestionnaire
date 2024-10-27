import request from "supertest";
import express from "express";
import { User, UserDocument } from "../models/user";
import { Region, RegionDocument } from "../models/region";
import { Question, QuestionDocument } from "../models/question";
import { connectDB } from "../config/connectDb";
import { questionRoutes } from "../routes/v1/question";
import { connectCache, redisClient } from "../config/redisCache";
import { initializeJobs } from "../agendas/questionCyclingAgenda";

const app = express();
app.use("/api/v1/questions", questionRoutes);

describe("GET /api/v1/questions/:userId", () => {
  jest.setTimeout(120000);
  let user: UserDocument;
  let region: RegionDocument;
  let questions: QuestionDocument[] = [];

  beforeAll(async () => {
    await connectDB();
    await connectCache();
    await initializeJobs();

    region = await Region.create({
      name: "Test Region",
      timezone: "UTC",
      cycleConfig: {
        cycleDuration: 7,
        startDate: new Date(),
      },
      activeCycle: 1,
    });

    user = await User.create({
      name: "Test User",
      region: region._id,
    });

    questions = await Question.create([
      {
        content: "What is your favorite local dish?",
        region: region._id,
        sequence: 1,
      },
      {
        content: "What is your favorite color?",
        region: region._id,
        sequence: 2,
      },
      {
        content: "What is your favorite hobby?",
        region: region._id,
        sequence: 3,
      },
    ]);
  });

  afterAll(async () => {
    await Question.deleteMany({ _id: { $in: questions.map((q) => q._id) } });
    await User.deleteOne({ _id: user._id });
    await Region.deleteOne({ _id: region._id });
  });

  it("should retrieve the first question for the active cycle", async () => {
    const res = await request(app).get(`/api/v1/questions/${user._id}`);
    await redisClient.flushAll();
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty(
      "content",
      "What is your favorite local dish?"
    );
  });

  it("should retrieve the second question for the second cycle", async () => {
    region.activeCycle = 2;
    await redisClient.flushAll();
    await region.save();

    const res = await request(app).get(`/api/v1/questions/${user._id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("content", "What is your favorite color?");
  });

  it("should retrieve the third question for the third cycle", async () => {
    region.activeCycle = 3;
    await redisClient.flushAll();
    await region.save();

    const res = await request(app).get(`/api/v1/questions/${user._id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("content", "What is your favorite hobby?");
  });

  it("should return 404 if user is not found", async () => {
    const res = await request(app).get(`/api/v1/questions/${region._id}`);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "User not found");
  });

  it("should return 404 if region is not found", async () => {
    await Region.deleteOne({ _id: region._id });
    const res = await request(app).get(`/api/v1/questions/${user._id}`);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "User's Region not found");
  });
});
