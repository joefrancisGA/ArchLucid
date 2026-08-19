import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { FindingDispositionKind } from "@/lib/api/governance-stickiness-api";
import {
  DISPOSITION_EXPORT_IMPACT_SPONSOR_ROI_SECTION_HEADING,
  getDispositionExportImpactLines,
} from "@/lib/disposition-export-impact";

const BULK_DISPOSITION_KINDS = ["Accepted", "RejectedAsNotApplicable", "Deferred"] as const satisfies readonly FindingDispositionKind[];

describe("disposition-export-impact (TB-2184)", () => {
  it("documents signed-record, sponsor-packet, and audit-trail impact for bulk disposition actions", () => {
    for (const disposition of BULK_DISPOSITION_KINDS) {
      const lines = getDispositionExportImpactLines(disposition);

      expect(lines).toHaveLength(3);
      expect(lines.find((line) => line.surface === "signed_review_record")?.included).toBe(false);
      expect(lines.find((line) => line.surface === "audit_trail")?.included).toBe(true);
      expect(lines.find((line) => line.surface === "sponsor_packet")?.included).toBe(true);
    }
  });

  it("maps Accepted to the Accepted risk sponsor ROI bucket", () => {
    const sponsorLine = getDispositionExportImpactLines("Accepted").find((line) => line.surface === "sponsor_packet");

    expect(sponsorLine?.detail).toContain("Accepted risk");
    expect(sponsorLine?.detail).toContain(DISPOSITION_EXPORT_IMPACT_SPONSOR_ROI_SECTION_HEADING);
  });

  it("maps RejectedAsNotApplicable to the rejected sponsor ROI bucket", () => {
    const sponsorLine = getDispositionExportImpactLines("RejectedAsNotApplicable").find(
      (line) => line.surface === "sponsor_packet",
    );

    expect(sponsorLine?.detail).toContain("Rejected (not applicable)");
  });

  it("maps Deferred to the deferred sponsor ROI bucket", () => {
    const sponsorLine = getDispositionExportImpactLines("Deferred").find((line) => line.surface === "sponsor_packet");

    expect(sponsorLine?.detail).toContain("Deferred");
  });

  it("stays aligned with SponsorReviewPacketComposer ROI basis section heading", () => {
    const composerSource = readFileSync(
      join(process.cwd(), "..", "ArchLucid.Application/Exports/SponsorReviewPacketComposer.cs"),
      "utf8",
    );

    expect(composerSource).toContain(`## ${DISPOSITION_EXPORT_IMPACT_SPONSOR_ROI_SECTION_HEADING}`);
    expect(composerSource).toContain("**Accepted risk:**");
    expect(composerSource).toContain("**Deferred:**");
    expect(composerSource).toContain("**Rejected (not applicable):**");
  });
});
