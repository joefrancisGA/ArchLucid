import { describe, expect, it } from "vitest";

import { formatRunListTitleWithDisambiguator } from "@/lib/operator/run-home-list-disambiguator";
import type { RunSummary } from "@/types/authority";

function duplicateTitleRun(runId: string, createdUtc?: string): RunSummary {
  return {
    runId,
    projectId: "default",
    description: "Payments platform",
    ...(createdUtc !== undefined ? { createdUtc } : {}),
  };
}

describe("formatRunListTitleWithDisambiguator", () => {
  it("falls back to run id suffix when duplicate titles have unparseable createdUtc", () => {
    const siblings = [
      duplicateTitleRun("851472cf-aaaa-bbbb-cccc-ddd083248324", "not-an-instant"),
      duplicateTitleRun("851472cf-1111-2222-3333-444083248325", "also-invalid"),
    ];

    const label = formatRunListTitleWithDisambiguator(siblings[0], siblings);

    expect(label).toBe("Payments platform · 248324");
    expect(label).not.toMatch(/Started not-an-instant/);
  });

  it("disambiguates duplicate titles with relative start time when createdUtc is valid", () => {
    const siblings = [
      duplicateTitleRun("run-a", "2026-01-15T12:00:00.000Z"),
      duplicateTitleRun("run-b", "2026-01-20T12:00:00.000Z"),
    ];

    const label = formatRunListTitleWithDisambiguator(siblings[0], siblings);

    expect(label).toContain("Payments platform · Started");
  });
});
