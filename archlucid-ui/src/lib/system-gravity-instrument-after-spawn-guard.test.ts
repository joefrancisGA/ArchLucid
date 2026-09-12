import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { deriveWorkingInstrumentReviewHeaderPresentation } from "@/lib/run-detail-workspace-derive/review-presentation";
import { SYSTEM_GRAVITY_ADR_0098_RELATIVE_PATH } from "@/lib/system-gravity-adr-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("system-gravity instrument-after-spawn guard (SG-093 / SG-106 / ADR 0098)", () => {
  it("Working nested review header keeps architecture name as H1, not review-home title", () => {
    const presentation = deriveWorkingInstrumentReviewHeaderPresentation({
      architectureDisplayName: "Payments platform",
      reviewTitle: "Q3 card capture migration",
      runId: "run-abc-123",
    });

    expect(presentation.h1Title).toBe("Payments platform");
    expect(presentation.h1Title).not.toMatch(/ review$/i);
    expect(presentation.eyebrowLabel).toBe("Q3 card capture migration");
  });

  it("cites ADR 0098 contract on disk", () => {
    const adr = readFileSync(join(REPO_ROOT, SYSTEM_GRAVITY_ADR_0098_RELATIVE_PATH), "utf8");

    expect(adr).toMatch(/instrument after spawn/i);
    expect(adr).toMatch(/job inspector/i);
  });
});
