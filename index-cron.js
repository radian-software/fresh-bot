import cron from "node-cron";

import { run } from "./src/run.js";

const main = async () => {
  console.log("Running once at startup...");
  try {
    await run();
  } catch (err) {
    console.log(err);
  }
  console.log("Running once at startup... done");

  console.log("Started crontab...");
  cron.schedule(`0 0 * * *`, async () => {
    console.log(`Running from cron...`);
    await run();
    console.log(`Running from cron... done`);
  });
};

main().catch(console.error);
