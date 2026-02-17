import { Worker } from "bullmq";

import { getRedis } from "@/server/redis";
import { sendReminder } from "@/server/services/reminders";
import { applyLateFee } from "@/server/services/late-fees";

// BullMQ worker process. Run in a separate terminal: `pnpm worker`
// This is responsible for reminders/dunning + late-fee automation.

new Worker(
  "reminders",
  async (job) => {
    if (job.name === "send-reminder") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = job.data as any;
      await sendReminder({ invoiceId: data.invoiceId, ruleId: data.ruleId });
    }
  },
  { connection: getRedis() },
);

new Worker(
  "late-fees",
  async (job) => {
    if (job.name === "apply-late-fee") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = job.data as any;
      await applyLateFee({ invoiceId: data.invoiceId, policyId: data.policyId });
    }
  },
  { connection: getRedis() },
);

// Keep process alive
console.log("Invoicia worker running (reminders, late-fees)...");
