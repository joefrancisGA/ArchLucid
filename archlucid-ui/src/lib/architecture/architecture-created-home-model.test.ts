import { describe, expect, it } from "vitest";

import { buildArchitectureCreatedHomeModel } from "@/lib/architecture/architecture-created-home-model";

const baseInput = {
  runId: "run-1",
  architectureName: "Claims intake platform",
  architectureOverview:
    "A governed workflow platform for analysts with Entra ID authentication, auditable evidence trails, and exportable architecture reviews for enterprise tenants.",
  businessOutcome: "Reduce manual triage time and improve auditability for operations teams.",
  peopleAndSystems: [
    { label: "Claims analyst", kind: "Human" },
    { label: "Partner billing API", kind: "Machine" },
  ],
  ownerLabel: "owner@example.com",
  lastUpdatedLabel: "Jul 11, 2026",
  workspaceStatus: { label: "Draft", kind: "draft" as const, statusTagKind: "neutral" as const },
  assessmentInProgress: false,
  hasArtifacts: false,
  correctionHref: "/architecture/reviews/new?path=guided-intake&rerun=run-1",
  gapAssertion: { businessOutcome: true, peopleAndSystems: true },
  gapSourceCapturedAtUtc: null,
};

describe("buildArchitectureCreatedHomeModel", () => {
  it("builds a strong-foundation status when overview, outcome, and people are present", () => {
    const model = buildArchitectureCreatedHomeModel(baseInput);

    expect(model.definitionStatus).toBe("strong-foundation");
    expect(model.definitionStatusLabel).toBe("Strong foundation");
    expect(model.summaryFields.map((field) => field.label)).toEqual(
      expect.arrayContaining(["Business purpose", "Primary users", "Major systems"]),
    );
    expect(model.primaryActions[0]?.primary).toBe(true);
    expect(model.primaryActions[0]?.label).toBe("Run initial assessment");
  });

  it("prioritizes continue clarifying when important context is missing", () => {
    const model = buildArchitectureCreatedHomeModel({
      ...baseInput,
      architectureOverview: "Short overview.",
      businessOutcome: "",
      peopleAndSystems: [],
      architectureName: "",
    });

    expect(model.definitionStatus).toBe("insufficient-context");
    expect(model.missingItems.length).toBeGreaterThan(0);
    expect(model.primaryActions.find((action) => action.primary)?.label).toBe("Continue clarifying");
  });

  it("partitions missing items by category", () => {
    const model = buildArchitectureCreatedHomeModel({
      ...baseInput,
      architectureOverview: "",
      businessOutcome: "",
      peopleAndSystems: [],
      architectureName: "",
      assessmentInProgress: true,
      hasArtifacts: false,
    });

    expect(model.clarificationGaps.length).toBeGreaterThan(0);
    expect(model.evidenceGaps.some((item) => item.id === "diagram")).toBe(true);
    expect(model.assessmentItems.some((item) => item.id === "assessment-progress")).toBe(true);
  });

  it("suppresses business-outcome gap when assertion is disabled", () => {
    const model = buildArchitectureCreatedHomeModel({
      ...baseInput,
      businessOutcome: "",
      gapAssertion: { businessOutcome: false, peopleAndSystems: true },
    });

    expect(model.clarificationGaps.some((item) => item.id === "business-outcome")).toBe(false);
  });
});
