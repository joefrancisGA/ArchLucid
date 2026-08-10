import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  RUN_DETAIL_FINALIZED_ARCHITECT_SECTION_ORDER,
} from "./run-detail-architect-section-order";

const pageViewSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "RunDetailPageView.tsx"),
  "utf8",
);

const belowFoldSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "RunDetailBelowFoldSections.tsx"),
  "utf8",
);

describe("run-detail-architect-section-order (TB-620)", () => {
  it("documents finalized architect section order", () => {
    expect(RUN_DETAIL_FINALIZED_ARCHITECT_SECTION_ORDER.indexOf("findings")).toBeLessThan(
      RUN_DETAIL_FINALIZED_ARCHITECT_SECTION_ORDER.indexOf("decision-delta"),
    );
    expect(RUN_DETAIL_FINALIZED_ARCHITECT_SECTION_ORDER.indexOf("findings")).toBeLessThan(
      RUN_DETAIL_FINALIZED_ARCHITECT_SECTION_ORDER.indexOf("below-fold"),
    );
    expect(RUN_DETAIL_FINALIZED_ARCHITECT_SECTION_ORDER.indexOf("evidence-trust")).toBeLessThan(
      RUN_DETAIL_FINALIZED_ARCHITECT_SECTION_ORDER.indexOf("below-fold"),
    );
  });

  // Replaces an earlier source-order assertion. Order of JSX within RunDetailPageView stopped
  // implying render order once the workspace became tabbed: each tab renders independently, so the
  // invariant worth guarding is that a section is owned by exactly one tab, not where its JSX sits.
  // Gating these out of RunDetailBelowFoldSections must not drop them from the workspace entirely:
  // each has to stay mounted on the tab that LEGACY_HASH_TO_TAB assigns it to.
  it("keeps every tab-owned section mounted in the page view", () => {
    const sectionsOwnedByOneTab = [
      "<RunDetailExplanationDeferred",
      "<RunDetailArtifactsExportsSectionDeferred",
      "<RunDetailManifestSummaryAlerts",
      "<RunDetailRunActionsSection",
    ] as const;

    for (const marker of sectionsOwnedByOneTab) {
      expect(pageViewSource, `${marker} must stay mounted on its owning tab`).toContain(marker);
    }
  });

  it("tells the tabbed workspace's below-fold block that tabs own those sections", () => {
    expect(pageViewSource).toContain("renderedInsideTabbedWorkspace");
    // Superseded by renderedInsideTabbedWorkspace, which covers all four tab-owned sections.
    expect(pageViewSource).not.toContain("skipArtifactsExports");
    expect(belowFoldSource).not.toContain("skipArtifactsExports");
  });

  it("gates every tab-owned section in the shared below-fold block", () => {
    expect(belowFoldSource).toContain("const ownedByAnotherTab = props.renderedInsideTabbedWorkspace === true;");
    expect(belowFoldSource).toContain("{!ownedByAnotherTab && !m.buyerPolishedArtifactTable && m.manifestId ? (");
    expect(belowFoldSource).toContain("{m.manifestId && !ownedByAnotherTab && !m.buyerPolishedArtifactTable ? (");
    expect(belowFoldSource).toContain("{m.manifestId && !ownedByAnotherTab ? (");
    expect(pageViewSource).not.toContain("RunDetailTabbedSectionNavDeferred");
    expect(pageViewSource).toContain("ReviewDetailWorkspaceDeferred");
  });

  it("places operator findings before pipeline timeline in below-fold", () => {
    const findingsIndex = belowFoldSource.indexOf("<RunDetailExplanationDeferred");
    const pipelineIndex = belowFoldSource.indexOf("<RunDetailPipelineTimelineSection");

    expect(findingsIndex).toBeGreaterThan(-1);
    expect(pipelineIndex).toBeGreaterThan(-1);
    expect(findingsIndex).toBeLessThan(pipelineIndex);
  });
});
