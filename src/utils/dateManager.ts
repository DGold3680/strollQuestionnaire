import { dayTimeZone } from "../config/dayjsConfig";

export const dateManager = {
  getCurrentCycleForRegion: (
    startDate: Date,
    cycleDuration: number,
    timezone: string
  ) => {
    const now = dayTimeZone().tz(timezone);
    const start = dayTimeZone(startDate).tz(timezone);
    const diffDays = now.diff(start, "days");
    return Math.floor(diffDays / cycleDuration) + 1;
  },

  getNextCycleDate: (
    startDate: Date,
    currentCycle: number,
    cycleDuration: number,
    timezone: string
  ) => {
    return dayTimeZone(startDate)
      .tz(timezone)
      .add(currentCycle * cycleDuration, "days")
      .hour(19)
      .minute(0)
      .second(0);
  },
};
