import core from "@actions/core";

import { run } from "./src/run.js";

run().catch((err) => {
  core.setFailed(err.toString());
});
