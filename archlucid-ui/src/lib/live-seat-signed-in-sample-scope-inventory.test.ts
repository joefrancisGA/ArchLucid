import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const INVENTORY_PATH = join(
  process.cwd(),
  "..",
  "docs",
  "architecture",
  "LIVE_SEAT_SIGNED_IN_SAMPLE_SCOPE_INVENTORY.md",
);

describe("LIVE_SEAT_SIGNED_IN_SAMPLE_SCOPE_INVENTORY (LS-002)", () => {
  it("exists and names bootstrapDedicatedWorkspaceScope and visitSampleWorkspaceScope", () => {
    const markdown = readFileSync(INVENTORY_PATH, "utf8");

    expect(markdown).toContain("bootstrapDedicatedWorkspaceScope");
    expect(markdown).toContain("visitSampleWorkspaceScope");
    expect(markdown).toMatch(/Inventory table/i);
  });
});
