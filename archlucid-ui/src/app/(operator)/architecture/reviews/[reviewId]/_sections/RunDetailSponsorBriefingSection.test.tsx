import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { resolveRunDetailSponsorBriefingSection } from "./resolve-run-detail-sponsor-briefing-section";

vi.mock("./run-detail-sponsor-briefing-deferred-chunks", () => ({
  EmailRunToSponsorBannerDeferred: () => null,
  PilotRoiValidationHandoffClientDeferred: () => null,
}));

const sectionsDir = dirname(fileURLToPath(import.meta.url));

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

  it("keeps the resolve helper server-safe so RSC run-detail views do not call a client export", () => {
    const resolveSource = readFileSync(join(sectionsDir, "resolve-run-detail-sponsor-briefing-section.tsx"), "utf8");
    const clientSource = readFileSync(join(sectionsDir, "RunDetailSponsorBriefingSection.tsx"), "utf8");
    const committedSource = readFileSync(join(sectionsDir, "RunDetailPageViewCommitted.tsx"), "utf8");

    expect(clientSource.trimStart().startsWith('"use client"')).toBe(true);
    expect(resolveSource).not.toMatch(/^["']use client["']/);
    expect(resolveSource).toContain("export function resolveRunDetailSponsorBriefingSection");
    expect(committedSource).toContain('from "./resolve-run-detail-sponsor-briefing-section"');
    expect(committedSource).not.toContain('from "./RunDetailSponsorBriefingSection"');
  });
});

vi.mock("./run-detail-sponsor-briefing-deferred-chunks", () => ({
  EmailRunToSponsorBannerDeferred: () => null,
  PilotRoiValidationHandoffClientDeferred: () => null,
}));

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
