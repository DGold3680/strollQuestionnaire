import Agenda, { Job } from "agenda";
import { Region } from "../models/region";
// import { client as cache } from '../config/cache';
import { dateManager } from "../utils/dateManager";
import { Schema } from "mongoose";
import { Dayjs } from "dayjs";
import { redisClient } from "../config/redisCache";

const mongoConnectionString = process.env.MONGODB_URI as string;

const questionCyclingAgenda = new Agenda({
  db: { address: mongoConnectionString, collection: "questionCyclingAgendas" },
});

questionCyclingAgenda.define("updateRegionCycle", async (job: Job) => {
  const { regionId }: { regionId?: Schema.Types.ObjectId } = job.attrs.data;
  if(!regionId){
    return
  }

  try {
    const region = await Region.findById(regionId);
    if (!region) return;

    await redisClient.set(`regionQuestion:${regionId}:in-transition`, "true", { EX: 5 });

    const currentCycle = dateManager.getCurrentCycleForRegion(
      region.cycleConfig.startDate,
      region.cycleConfig.cycleDuration,
      region.timezone
    );

    region.activeCycle = currentCycle;
    await region.save();

    // // Invalidate region cache
    await redisClient.del(`regionQuestion:${regionId}`);

    // Schedule next transition
    const nextTransitionDate = dateManager.getNextCycleDate(
      region.cycleConfig.startDate,
      currentCycle,
      region.cycleConfig.cycleDuration,
      region.timezone
    );

    await scheduleNextTransition(region._id, nextTransitionDate);

    await redisClient.del(`regionQuestion:${regionId}:in-transition`);
  } catch (error) {
    console.error("Error in cycle transition:", error);
    await redisClient.del(`regionQuestion:${regionId}:in-transition`);
  }
});

const scheduleNextTransition = async (regionId:Schema.Types.ObjectId , transitionDate:Dayjs) => {
  await questionCyclingAgenda.schedule(transitionDate.toDate(), "updateRegionCycle", {
    regionId,
  });
};

const initializeJobs = async () => {
  await questionCyclingAgenda.start();
  console.log("Cycling Agenda Started");

  const regions = await Region.find({});
  
  const schedulingPromises = regions.map(async (region) => {
    const nextTransitionDate = dateManager.getNextCycleDate(
      region.cycleConfig.startDate,
      region.activeCycle,
      region.cycleConfig.cycleDuration,
      region.timezone
    );
    return scheduleNextTransition(region._id, nextTransitionDate);
  });

  await Promise.all(schedulingPromises);
  console.log("All cycling schedule started");
};

export {
  questionCyclingAgenda,
  initializeJobs,
  scheduleNextTransition,
};
