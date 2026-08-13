import { describe, expect, it } from "vitest";

import {
  assessArchitectureSponsorReadiness,
  detectPolicyProhibitedSponsorSharing,
  detectRestrictedArchitectureInformation,
} from "@/lib/architecture/architecture-sponsor-readiness";
import type { BuildArchitectureCreatedHomeModelInput } from "@/lib/architecture/architecture-created-home-model";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import {
  buildArchitectureSponsorDraftWatermark,
  buildArchitectureSponsorShareMarkdown,
} from "@/lib/architecture/architecture-sponsor-preliminary-draft";

function baseArchitecture(
  partial?: Partial<BuildArchitectureCreatedHomeModelInput>,
): BuildArchitectureCreatedHomeModelInput {
  return {
    runId: "run-1",
    architectureName: "Retail API platform",
    architectureOverview:
      "Customer-facing API on Azure with private networking, 99.9% availability, and EU residency for payment isolation.",
    businessOutcome: "Launch a resilient retail API with clear compliance boundaries.",
    peopleAndSystems: [
      { label: "Store associate", kind: "Human" },
      { label: "Payment gateway", kind: "Machine" },
    ],
    ownerLabel: "alex@example.com",
    lastUpdatedLabel: "Jul 11, 2026",
    workspaceStatus: { label: "Draft", kind: "draft", statusTagKind: "neutral" },
    assessmentInProgress: false,
    hasArtifacts: true,
    correctionHref: "/architecture/reviews/new?path=guided-intake&rerun=run-1",
    gapAssertion: { businessOutcome: true, peopleAndSystems: true },
    gapSourceCapturedAtUtc: null,
    ...partial,
  };
}

function finding(severityValue: number): QuickDecisionFinding {
  return {
    findingId: "finding-1",
    title: "Encrypt data at rest",
    recommendation: "Enable encryption.",
    severityValue,
    findingOrder: 0,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "blocking",
  };
}

describe("architecture-sponsor-readiness", () => {
  it("rates a complete architecture as ready", () => {
    const architectureSourceText =
      "## Trust boundaries\nPrivate networking between ingress and data stores.\n" +
      "## Assumptions\n99.9% availability target.\n" +
      "## External integrations\nPayment gateway";

    const assessment = assessArchitectureSponsorReadiness({
      architecture: baseArchitecture(),
      architectureSourceText,
      findings: [],
      canShare: true,
    });

    expect(assessment.status).toBe("ready");
    expect(assessment.sharingBlocked).toBe(false);
  });

  it("rates incomplete architecture as preliminary only with unresolved conditions", () => {
    const assessment = assessArchitectureSponsorReadiness({
      architecture: baseArchitecture({
        ownerLabel: null,
        businessOutcome: "",
        peopleAndSystems: [],
        architectureOverview: "Short overview.",
      }),
      architectureSourceText: "Short overview.",
      findings: [finding(4)],
      canShare: true,
    });

    expect(assessment.status).toBe("preliminary-only");
    expect(assessment.issues.length).toBeGreaterThan(0);
    expect(assessment.issues.some((issue) => issue.id === "missing-business-owner")).toBe(true);
  });

  it("blocks sharing when policy prohibits external sponsor distribution", () => {
    const sourceText = "Retail platform [SPONSOR-SHARING-PROHIBITED]";
    const assessment = assessArchitectureSponsorReadiness({
      architecture: baseArchitecture(),
      architectureSourceText: sourceText,
      findings: [],
      canShare: true,
    });

    expect(detectPolicyProhibitedSponsorSharing(sourceText)).toBe(true);
    expect(assessment.sharingBlocked).toBe(true);
    expect(assessment.sharingBlockReason).toBe("policy");
  });

  it("blocks sharing for users without operator permission", () => {
    const assessment = assessArchitectureSponsorReadiness({
      architecture: baseArchitecture(),
      architectureSourceText: "## Trust boundaries\nSegmented network zones.",
      findings: [],
      canShare: false,
    });

    expect(assessment.sharingBlocked).toBe(true);
    expect(assessment.sharingBlockReason).toBe("permission");
  });

  it("detects restricted information markers", () => {
    expect(detectRestrictedArchitectureInformation("Contains [RESTRICTED] deployment notes")).toBe(true);
  });
});

describe("architecture-sponsor-preliminary-draft", () => {
  it("includes preliminary watermark labels in copied markdown", () => {
    const markdown = buildArchitectureSponsorShareMarkdown({
      runId: "run-1",
      architectureName: "Retail API platform",
      architectureOverview: "Overview",
      businessOutcome: "Outcome",
      ownerLabel: "alex@example.com",
      knownGaps: ["Missing trust boundaries"],
      confidentialityLabel: "Internal — preliminary architecture draft",
      generatedAtIso: "2026-07-11T12:00:00.000Z",
      readinessStatus: "preliminary-only",
      siteOrigin: "https://app.archlucid.test",
    });

    expect(markdown).toContain("Preliminary draft");
    expect(markdown).toContain("Not approved");
    expect(markdown).toContain("Known gaps");
    expect(markdown).toContain("Missing trust boundaries");

    const watermark = buildArchitectureSponsorDraftWatermark({
      knownGaps: ["Missing trust boundaries"],
      confidentialityLabel: "Internal — preliminary architecture draft",
      generatedAtIso: "2026-07-11T12:00:00.000Z",
    });

    expect(watermark.preliminaryDraft).toBe(true);
    expect(watermark.notApproved).toBe(true);
  });
});
