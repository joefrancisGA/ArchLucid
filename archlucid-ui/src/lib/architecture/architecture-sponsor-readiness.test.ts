import { describe, expect, it } from "vitest";

import {
  assessArchitectureSponsorReadiness,
  detectPolicyProhibitedSponsorSharing,
  detectRestrictedArchitectureInformation,
  resolveArchitectureConfidentialityLabel,
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

function finding(severityValue: number, wireJson = "{}"): QuickDecisionFinding {
  return {
    findingId: "finding-1",
    title: "Encrypt data at rest",
    recommendation: "Enable encryption.",
    severityValue,
    findingOrder: 0,
    aiReasoning: { wireJson, reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "blocking",
  };
}

const completeArchitectureSourceText =
  "## Trust boundary\n- Private networking between ingress and data stores.\n" +
  "## Assumptions\n- 99.9% availability target.\n" +
  "## External integrations\n- Payment gateway";

describe("architecture-sponsor-readiness", () => {
  it("rates a complete architecture as ready", () => {
    const assessment = assessArchitectureSponsorReadiness({
      architecture: baseArchitecture(),
      architectureSourceText: completeArchitectureSourceText,
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

  it("does not treat disposition-closed critical findings as unresolved high-severity risks", () => {
    const assessment = assessArchitectureSponsorReadiness({
      architecture: baseArchitecture(),
      architectureSourceText: completeArchitectureSourceText,
      findings: [
        finding(4, JSON.stringify({ latestDisposition: "Accepted" })),
      ],
      canShare: true,
    });

    expect(assessment.status).toBe("ready");
    expect(assessment.issues.some((issue) => issue.id === "unresolved-high-severity-risks")).toBe(false);
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

  it("does not infer confidentiality from HIPAA or PCI keywords alone", () => {
    expect(resolveArchitectureConfidentialityLabel("HIPAA workload")).toBeNull();
    expect(resolveArchitectureConfidentialityLabel("PCI gateway")).toBeNull();
    expect(resolveArchitectureConfidentialityLabel("confidentiality: Partner review only")).toBe(
      "Partner review only",
    );
  });

  it("still flags missing trust boundaries when overview only mentions private networking", () => {
    const assessment = assessArchitectureSponsorReadiness({
      architecture: baseArchitecture({
        architectureOverview: "Uses private networking between tiers.",
        peopleAndSystems: [{ label: "API", kind: "Machine" }],
      }),
      architectureSourceText: "Uses private networking between tiers.",
      findings: [],
      canShare: true,
    });

    expect(assessment.issues.some((issue) => issue.id === "missing-trust-boundaries")).toBe(true);
  });

  it("labels unresolved critical findings separately from high-severity findings", () => {
    const assessment = assessArchitectureSponsorReadiness({
      architecture: baseArchitecture(),
      architectureSourceText: completeArchitectureSourceText,
      findings: [finding(3)],
      canShare: true,
    });

    expect(assessment.issues.some((issue) => issue.label.includes("unresolved critical risk"))).toBe(true);
    expect(assessment.issues.some((issue) => issue.label.includes("high-severity"))).toBe(false);
  });

  it("uses stored-overview labels without strength grading", () => {
    const thin = assessArchitectureSponsorReadiness({
      architecture: baseArchitecture({ architectureOverview: "Short overview text for sponsor." }),
      architectureSourceText: completeArchitectureSourceText,
      findings: [],
      canShare: true,
    });
    const strong = assessArchitectureSponsorReadiness({
      architecture: baseArchitecture({
        architectureOverview:
          "A".repeat(120),
      }),
      architectureSourceText: completeArchitectureSourceText,
      findings: [],
      canShare: true,
    });

    expect(thin.architectureCompletenessLabel).toContain("still short");
    expect(strong.architectureCompletenessLabel).toBe("Architecture overview was stored.");
    expect(strong.architectureCompletenessLabel).not.toContain("Strong");
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
    expect(markdown).toContain("Readiness check");
    expect(markdown).toContain("Missing trust boundaries");

    const watermark = buildArchitectureSponsorDraftWatermark({
      knownGaps: ["Missing trust boundaries"],
      confidentialityLabel: "Internal — preliminary architecture draft",
      generatedAtIso: "2026-07-11T12:00:00.000Z",
    });

    expect(watermark.preliminaryDraft).toBe(true);
    expect(watermark.notApproved).toBe(true);
  });

  it("uses system-name omission for blank architecture headings", () => {
    const markdown = buildArchitectureSponsorShareMarkdown({
      runId: "run-1",
      architectureName: " ",
      architectureOverview: "Overview",
      businessOutcome: "Outcome",
      ownerLabel: "owner@example.com",
      knownGaps: [],
      confidentialityLabel: "Internal",
      generatedAtIso: "2026-07-11T12:00:00.000Z",
      readinessStatus: "preliminary-only",
      siteOrigin: "https://app.archlucid.test",
    });

    expect(markdown).toContain("# System name was not stored");
    expect(markdown).not.toMatch(/^# \s*$/m);
  });

  it("uses omission copy for missing sponsor draft fields and preserves stored values", () => {
    const markdown = buildArchitectureSponsorShareMarkdown({
      runId: "run-1",
      architectureName: "Retail API platform",
      architectureOverview: " ",
      businessOutcome: "",
      ownerLabel: null,
      knownGaps: [],
      confidentialityLabel: null,
      generatedAtIso: "2026-07-11T12:00:00.000Z",
      readinessStatus: "preliminary-only",
      siteOrigin: "https://app.archlucid.test",
    });

    expect(markdown).toContain("Confidentiality was not stored.");
    expect(markdown).toContain("Architecture overview was not stored.");
    expect(markdown).toContain("Business outcome was not stored.");
    expect(markdown).toContain("Sponsor owner was not stored.");

    const storedMarkdown = buildArchitectureSponsorShareMarkdown({
      runId: "run-1",
      architectureName: "Retail API platform",
      architectureOverview: "Stored overview",
      businessOutcome: "Stored outcome",
      ownerLabel: "Stored owner",
      knownGaps: [],
      confidentialityLabel: "Stored confidentiality",
      generatedAtIso: "2026-07-11T12:00:00.000Z",
      readinessStatus: "ready",
      siteOrigin: "https://app.archlucid.test",
    });

    expect(storedMarkdown).toContain("Stored overview");
    expect(storedMarkdown).toContain("Stored outcome");
    expect(storedMarkdown).toContain("Stored owner");
    expect(storedMarkdown).toContain("Stored confidentiality");
  });
});
