import mongoose from "mongoose";
import { User } from "./models/user"; // Adjust the import path as necessary
import { Region } from "./models/region"; // Adjust the import path as necessary
import { Question } from "./models/question"; // Adjust the import path as necessary
import { connectDB } from "./config/connectDb";

const seedDatabase = async () => {
  // Connect to MongoDB
  await connectDB();

  // Seed regions
  const regions = await Region.insertMany([
    {
      name: "United States",
      timezone: "America/New_York",
      cycleConfig: { cycleDuration: 7, startDate: new Date() },
      activeCycle: 1,
    },
    {
      name: "Singapore",
      timezone: "Asia/Singapore",
      cycleConfig: { cycleDuration: 7, startDate: new Date() },
      activeCycle: 1,
    },
  ]);

  console.log("Regions seeded:", regions);

  // Seed users
  const users = await User.insertMany([
    { name: "Alice", region: regions[0]._id }, // US
    { name: "Bob", region: regions[0]._id }, // US
    { name: "Charlie", region: regions[1]._id }, // Singapore
    { name: "Diana", region: regions[1]._id }, // Singapore
  ]);

  console.log("Users seeded:", users);

  // Seed questions
  const questions = await Question.insertMany([
    // 9 questions for US
    {
      content: "What is your favorite color?",
      region: regions[0]._id,
      sequence: 1,
    },
    { content: "What is your hobby?", region: regions[0]._id, sequence: 2 },
    { content: "What is your dream job?", region: regions[0]._id, sequence: 3 },
    { content: "Where do you live?", region: regions[0]._id, sequence: 4 },
    {
      content: "What is your favorite food?",
      region: regions[0]._id,
      sequence: 5,
    },
    {
      content: "What is your favorite movie?",
      region: regions[0]._id,
      sequence: 6,
    },
    {
      content: "What is your favorite sport?",
      region: regions[0]._id,
      sequence: 7,
    },
    {
      content: "What is your biggest fear?",
      region: regions[0]._id,
      sequence: 8,
    },
    {
      content: "What is your favorite book?",
      region: regions[0]._id,
      sequence: 9,
    },

    // 11 questions for Singapore
    {
      content: "What is your favorite local dish?",
      region: regions[1]._id,
      sequence: 1,
    },
    {
      content: "What is your favorite place to visit in Singapore?",
      region: regions[1]._id,
      sequence: 2,
    },
    {
      content: "What do you love about Singapore?",
      region: regions[1]._id,
      sequence: 3,
    },
    {
      content: "What is your favorite festival?",
      region: regions[1]._id,
      sequence: 4,
    },
    {
      content: "What is your favorite shopping district?",
      region: regions[1]._id,
      sequence: 5,
    },
    {
      content: "What is your favorite park?",
      region: regions[1]._id,
      sequence: 6,
    },
    {
      content: "What is your favorite pastime?",
      region: regions[1]._id,
      sequence: 7,
    },
    {
      content: "What is your favorite tourist attraction?",
      region: regions[1]._id,
      sequence: 8,
    },
    {
      content: "What is your favorite tradition?",
      region: regions[1]._id,
      sequence: 9,
    },
    {
      content: "What is your opinion on the local culture?",
      region: regions[1]._id,
      sequence: 10,
    },
    {
      content: "What do you think about the weather?",
      region: regions[1]._id,
      sequence: 11,
    },
  ]);

  console.log("Questions seeded:", questions);

  // Close the connection
  await mongoose.connection.close();
};

seedDatabase().catch(console.error);
