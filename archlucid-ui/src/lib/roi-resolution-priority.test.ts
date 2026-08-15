import { describe, expect, it } from "vitest";

import type { RunDetail } from "@/types/authority";

import {
  buildClientHoursSavingsSummary,
  buildSponsorServerSavingsSummary,
  countRunDetailFindingSeveritiesForRoi,
  resolveRunSavingsUsd,
} from "./roi-resolution-priority";

describe("resolveRunSavingsUsd", () => {
  it("prefers server findings over lower tiers", () => {
    const resolved = resolveRunSavingsUsd({
      serverSummary: { annualizedUsd: 9000, basisFootnotes: ["Server."], sourceKind: "server-findings" },
      extractorSummary: { annualizedUsd: 8000, basisFootnotes: ["Extractor."], sourceKind: "extractor-heuristic" },
      clientHoursSummary: { annualizedUsd: 7000, basisFootnotes: ["Client."], sourceKind: "client-hours-estimate" },
      staticDemoSummary: { annualizedUsd: 6000, basisFootnotes: ["Demo."], sourceKind: "static-demo" },
    });

    expect(resolved?.sourceKind).toBe("server-findings");
    expect(resolved?.annualizedUsd).toBe(9000);
  });

  it("falls through to extractor, client hours, then static demo", () => {
    expect(
      resolveRunSavingsUsd({
        extractorSummary: { annualizedUsd: 4200, basisFootnotes: [], sourceKind: "extractor-heuristic" },
        clientHoursSummary: { annualizedUsd: 3100, basisFootnotes: [], sourceKind: "client-hours-estimate" },
      })?.sourceKind,
    ).toBe("extractor-heuristic");

    expect(
      resolveRunSavingsUsd({
        clientHoursSummary: { annualizedUsd: 3100, basisFootnotes: [], sourceKind: "client-hours-estimate" },
        staticDemoSummary: { annualizedUsd: 94360, basisFootnotes: [], sourceKind: "static-demo" },
      })?.sourceKind,
    ).toBe("client-hours-estimate");

    expect(
      resolveRunSavingsUsd({
        staticDemoSummary: { annualizedUsd: 94360, basisFootnotes: [], sourceKind: "static-demo" },
      })?.sourceKind,
    ).toBe("static-demo");
  });

  it("returns null when every tier is absent or non-positive", () => {
    expect(
      resolveRunSavingsUsd({
        serverSummary: { annualizedUsd: 0, basisFootnotes: [], sourceKind: "server-findings" },
        clientHoursSummary: null,
      }),
    ).toBeNull();
  });
});

describe("buildSponsorServerSavingsSummary", () => {
  it("rounds positive sponsor totals and preserves pricing basis footnotes", () => {
    const model = buildSponsorServerSavingsSummary(12500.4, "Tenant-adjusted portfolio rollup.");

    expect(model?.annualizedUsd).toBe(12500);
    expect(model?.sourceKind).toBe("server-findings");
    expect(model?.basisFootnotes.join(" ")).toContain("Tenant-adjusted");
  });
});

describe("buildClientHoursSavingsSummary", () => {
  it("maps surfaced hours to USD using the supplied hourly rate", () => {
    const model = buildClientHoursSavingsSummary(
      { critical: 1, high: 0, medium: 0, precommitBlocks: 0 },
      150,
    );

    expect(model?.annualizedUsd).toBe(1200);
    expect(model?.sourceKind).toBe("client-hours-estimate");
  });
});

describe("countRunDetailFindingSeveritiesForRoi", () => {
  it("counts numeric and string severities from run detail findings", () => {
    const detail = {
      results: [
        {
          findings: [
            { severity: 3 },
            { severity: 2 },
            { severityLabel: "Medium" },
          ],
        },
      ],
    } as RunDetail;

    expect(countRunDetailFindingSeveritiesForRoi(detail)).toEqual({
      critical: 1,
      high: 1,
      medium: 1,
      precommitBlocks: 0,
    });
  });
});
