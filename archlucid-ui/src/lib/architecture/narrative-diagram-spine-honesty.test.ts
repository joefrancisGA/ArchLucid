import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DIAGRAM_PROVENANCE_SUMMARY_ACCEPTED_INFERENCE,
  ARCHITECTURE_DIAGRAM_PROVENANCE_SUMMARY_ASSERTED,
  formatArchitectureDiagramUnlabeledComponentsNotice,
} from "@/lib/architecture/architecture-diagram-copy";
import {
  architectureDiagramModelToMermaid,
  architectureDiagramModelToTextAlternative,
} from "@/lib/architecture/architecture-diagram-mermaid";
import {
  buildArchitectureDiagramNodeProvenanceDetail,
  summarizeArchitectureDiagramProvenance,
} from "@/lib/architecture/architecture-diagram-provenance";
import type { ArchitectureDiagramModel } from "@/lib/architecture/architecture-diagram-types";
import {
  FIRST_REVIEW_SPINE_CLASSIFICATION_COUNTS_NOT_STORED,
  FIRST_REVIEW_SPINE_DISPOSITIONS_NOT_STORED,
  deriveFirstReviewSpineBandSummary,
} from "@/lib/reviews/first-review-spine-band";
import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";

function diagramModel(partial: Partial<ArchitectureDiagramModel>): ArchitectureDiagramModel {
  return {
    nodes: partial.nodes ?? [],
    edges: partial.edges ?? [],
    trustBoundaryLabels: partial.trustBoundaryLabels ?? [],
    skippedUnlabeledEntityCount: partial.skippedUnlabeledEntityCount ?? 0,
    unmatchedDataFlows: partial.unmatchedDataFlows ?? [],
    diagramHonestyNotes: partial.diagramHonestyNotes,
  };
}

describe("narrative diagram spine honesty (P-01–P-04, P-11–P-12)", () => {
  it("counts asserted nodes separately from accepted inferences", () => {
    const model = diagramModel({
      nodes: [
        {
          id: "asserted",
          label: "Brief component",
          kind: "system",
          provenance: "asserted",
          removed: false,
          accepted: false,
        },
        {
          id: "accepted",
          label: "Inferred component",
          kind: "system",
          provenance: "inferred",
          removed: false,
          accepted: true,
        },
      ],
    });

    const summary = summarizeArchitectureDiagramProvenance(model);

    expect(summary.assertedNodeCount).toBe(1);
    expect(summary.acceptedInferenceNodeCount).toBe(1);
    expect(summary.inferredNodeCount).toBe(0);
    expect(
      `${ARCHITECTURE_DIAGRAM_PROVENANCE_SUMMARY_ASSERTED}: ${summary.assertedNodeCount} · ${ARCHITECTURE_DIAGRAM_PROVENANCE_SUMMARY_ACCEPTED_INFERENCE}: ${summary.acceptedInferenceNodeCount}`,
    ).toContain("Asserted: 1");
  });

  it("does not link brief-asserted nodes to the evidence tab", () => {
    const node = {
      id: "asserted",
      label: "API",
      kind: "system" as const,
      provenance: "asserted" as const,
      removed: false,
      accepted: false,
    };

    const detail = buildArchitectureDiagramNodeProvenanceDetail({
      runId: "run-1",
      node,
      diagramVersionSource: null,
    });

    expect(detail.provenanceClass).toBe("brief-asserted");
    expect(detail.sourceHref).toBeNull();
    expect(detail.sentence).toContain("asserted in the brief");
    expect(detail.sentence).not.toMatch(/evidence-backed/i);
  });

  it("names unlabeled components without skipped copy", () => {
    const model = diagramModel({
      nodes: [
        {
          id: "api",
          label: "API",
          kind: "system",
          provenance: "asserted",
          removed: false,
          accepted: false,
        },
      ],
      skippedUnlabeledEntityCount: 2,
    });

    const alt = architectureDiagramModelToTextAlternative(model);

    expect(alt).toContain(formatArchitectureDiagramUnlabeledComponentsNotice(2));
    expect(alt).not.toMatch(/skipped/i);
  });

  it("distinguishes removed components from never-recorded diagrams", () => {
    const removedOnly = diagramModel({
      nodes: [
        {
          id: "removed",
          label: "Old API",
          kind: "system",
          provenance: "asserted",
          removed: true,
          accepted: false,
        },
      ],
    });

    const message = "Recorded architecture components were removed from this diagram.";

    expect(architectureDiagramModelToTextAlternative(removedOnly)).toBe(message);
    expect(
      architectureDiagramModelToMermaid(removedOnly).replace(/\\n/g, " ").replace(/\s+/g, " "),
    ).toContain(message);
  });
});

describe("first-review spine honesty (P-05, P-13)", () => {
  const finding = {
    findingId: "f-1",
    title: "Issue",
    severityValue: 2,
    classification: "DecisionGradeFinding",
    evidenceRefCount: 1,
    humanReviewStatus: null,
    recommendation: "Fix",
    insightDensityScore: 90,
    isMuted: false,
    policyRuleId: null,
    engineKey: null,
  } as QuickDecisionFinding;

  it("withholds zero classification and disposition counts when snapshot missing", () => {
    const summary = deriveFirstReviewSpineBandSummary({
      feasibilityVerdict: null,
      structuralExecutionMode: "Simulator",
      findings: [finding],
      hasFindingsSnapshot: false,
    });

    expect(summary?.classificationCountsStored).toBe(false);
    expect(summary?.dispositionCountsStored).toBe(false);
    expect(FIRST_REVIEW_SPINE_CLASSIFICATION_COUNTS_NOT_STORED).toBe("Classification counts were not stored.");
    expect(FIRST_REVIEW_SPINE_DISPOSITIONS_NOT_STORED).toBe("Dispositions were not stored.");
  });

  it("shows stored Feasible gate kind instead of Proceed tier (P-03)", () => {
    const summary = deriveFirstReviewSpineBandSummary({
      feasibilityVerdict: { kind: "Feasible", summary: "Gate passed.", transparencyTrail: null },
      structuralExecutionMode: "Simulator",
      findings: [finding],
      hasFindingsSnapshot: true,
    });

    expect(summary?.gateOutcomeLabel).toBe("Feasible");
    expect(summary?.gateOutcomeLabel).not.toBe("Proceed");
  });
});
