import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { DAYTIME_WAIT_OPERATIONS_POLL_SURFACES } from "@/lib/daytime-wait-operations-poll-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("daytime-wait operations poll inventory (DW-005)", () => {
  it("lists shipped operations poll surfaces", () => {
    for (const relativePath of DAYTIME_WAIT_OPERATIONS_POLL_SURFACES) {
      expect(existsSync(join(REPO_ROOT, relativePath)), relativePath).toBe(true);
    }
  });
});
