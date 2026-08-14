import { isValidElement } from "react";
import { describe, expect, it } from "vitest";

import { resolveRunDetailSponsorBriefingSection } from "./RunDetailSponsorBriefingSection";

describe("resolveRunDetailSponsorBriefingSection", () => {
  const base = {
    routeRunId: "run-1",
    usedStaticDemoRun: false,
    buyerPolishedArtifactTable: true,
    artifacts: [{ artifactId: "architecture-review-board" }],
  } as const;

  it("returns null when the pilot scorecard package CTA is gated off", () => {
    expect(
      resolveRunDetailSponsorBriefingSection({
        ...base,
        showPilotScorecardPackageCta: false,
        manifestId: "manifest-1",
      }),
    ).toBeNull();
  });

  it("returns null when manifest id is missing", () => {
    expect(
      resolveRunDetailSponsorBriefingSection({
        ...base,
        showPilotScorecardPackageCta: true,
        manifestId: "   ",
      }),
    ).toBeNull();
  });

  it("returns the sponsor briefing section when the CTA gate passes", () => {
    const element = resolveRunDetailSponsorBriefingSection({
      ...base,
      showPilotScorecardPackageCta: true,
      manifestId: "manifest-1",
    });

    expect(isValidElement(element)).toBe(true);
  });
});
