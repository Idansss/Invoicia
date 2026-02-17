import { Queue } from "bullmq";

import { getRedis } from "@/server/redis";

const globalQueues = globalThis as unknown as {
  remindersQueue?: Queue;
  lateFeesQueue?: Queue;
};

export function getRemindersQueue() {
  if (globalQueues.remindersQueue) return globalQueues.remindersQueue;
  globalQueues.remindersQueue = new Queue("reminders", { connection: getRedis() });
  return globalQueues.remindersQueue;
}

export function getLateFeesQueue() {
  if (globalQueues.lateFeesQueue) return globalQueues.lateFeesQueue;
  globalQueues.lateFeesQueue = new Queue("late-fees", { connection: getRedis() });
  return globalQueues.lateFeesQueue;
}
