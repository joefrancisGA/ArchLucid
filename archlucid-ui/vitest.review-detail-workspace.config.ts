import { mergeConfig } from "vitest/config";

import baseConfig from "./vitest.config";

/**
 * Scoped config for `ui-review-detail-workspace` hunts: caps fork workers so each
 * child process runs fewer files before exit, reducing cumulative heap growth.
 */
export default mergeConfig(baseConfig, {
  test: {
    pool: "forks",
    maxWorkers: 4,
    minWorkers: 1,
    fileParallelism: true,
  },
});
