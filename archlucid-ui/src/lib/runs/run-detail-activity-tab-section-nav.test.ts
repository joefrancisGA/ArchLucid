import { describe, expect, it } from "vitest";

import { buildRunDetailActivityTabSections } from "@/lib/runs/run-detail-activity-tab-section-nav";

describe("buildRunDetailActivityTabSections", () => {
  it("includes lifecycle, progress, authority, and diagnostics on full operator activity tab", () => {
    const sections = buildRunDetailActivityTabSections({
      buyerPolishedArtifactTable: false,
      authorityChainLabel: "Authority chain",
    });

    expect(sections.map((section) => section.id)).toEqual([
      "pipeline-timeline",
      "pipeline-stages",
      "authority-chain",
      "agent-forensics",
    ]);
  });

  it("includes post-finalize package changes when manifest is present", () => {
    const sections = buildRunDetailActivityTabSections({
      buyerPolishedArtifactTable: true,
      authorityChainLabel: "",
      hasManifestId: true,
    });

    expect(sections.map((section) => section.id)).toEqual([
      "pipeline-timeline",
      "pipeline-stages",
      "package-changes-since-finalize",
    ]);
  });

  it("omits diagnostics on buyer-polished activity tab", () => {
    const sections = buildRunDetailActivityTabSections({
      buyerPolishedArtifactTable: true,
      authorityChainLabel: "Authority chain",
    });

    expect(sections.map((section) => section.id)).toEqual([
      "pipeline-timeline",
      "pipeline-stages",
      "authority-chain",
    ]);
  });
});
