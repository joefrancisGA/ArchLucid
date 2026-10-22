import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { resolvePipelineJobLabel } from "@/lib/architecture/architecture-package-origin";

const compositionSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "RunDetailActivityTabComposition.tsx"),
  "utf8",
);

describe("RunDetailActivityTabComposition working pipeline leakage (WS-16)", () => {
  it("passes workingDeskProgressCopy to every deferred progress tracker", () => {
    const trackerBlocks = compositionSource.match(/<RunDetailProgressTrackerDeferred[\s\S]*?\/>/g) ?? [];

    expect(trackerBlocks.length).toBeGreaterThanOrEqual(2);

    for (const block of trackerBlocks) {
      expect(block).toContain("workingDeskProgressCopy={m.buyerPolishedArtifactTable !== true}");
    }
  });

  it("uses review-progress labels on Working desk progress copy", () => {
    const label = resolvePipelineJobLabel(null, false, true);

    expect(label.heading).toBe("Review progress");
    expect(label.progressAriaLabel).toBe("Review stages completed");
    expect(label.progressAriaLabel).not.toContain("pipeline");
  });
});
