import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_CREATED_BUSINESS_PURPOSE_NOT_STORED,
  ARCHITECTURE_CREATED_KEY_INTEGRATIONS_NOT_STORED,
  ARCHITECTURE_CREATED_MAJOR_SYSTEMS_NOT_STORED,
  ARCHITECTURE_CREATED_PRIMARY_USERS_NOT_STORED,
  buildSummaryFields,
} from "@/lib/architecture/architecture-created-home-summary";
import type { BuildArchitectureCreatedHomeModelInput } from "@/lib/architecture/architecture-created-home-summary";
import type { RunDetailWorkspaceStatus } from "@/lib/run-detail-workspace-derive";

function baseInput(
  overrides: Partial<BuildArchitectureCreatedHomeModelInput> = {},
): BuildArchitectureCreatedHomeModelInput {
  return {
    runId: "run-1",
    architectureName: "Payments platform",
    architectureOverview: "A long overview that should not be copied into business purpose when outcome is blank.",
    businessOutcome: "",
    peopleAndSystems: [],
    ownerLabel: null,
    lastUpdatedLabel: "Jul 11, 2026",
    workspaceStatus: "active" as RunDetailWorkspaceStatus,
    assessmentInProgress: false,
    hasArtifacts: false,
    correctionHref: null,
    gapAssertion: { businessOutcome: true, peopleAndSystems: true },
    gapSourceCapturedAtUtc: null,
    ...overrides,
  };
}

describe("buildSummaryFields (al-polish P-04, P-05)", () => {
  it("does not copy overview into business purpose or architecture name into major systems", () => {
    const fields = buildSummaryFields(baseInput());

    expect(fields).toContainEqual({
      label: "Business purpose",
      value: ARCHITECTURE_CREATED_BUSINESS_PURPOSE_NOT_STORED,
    });
    expect(fields).toContainEqual({
      label: "Major systems",
      value: ARCHITECTURE_CREATED_MAJOR_SYSTEMS_NOT_STORED,
    });
    expect(fields).toContainEqual({
      label: "Primary users",
      value: ARCHITECTURE_CREATED_PRIMARY_USERS_NOT_STORED,
    });
    expect(fields).toContainEqual({
      label: "Key integrations",
      value: ARCHITECTURE_CREATED_KEY_INTEGRATIONS_NOT_STORED,
    });
    expect(fields.some((field) => field.value.includes("Payments platform"))).toBe(false);
    expect(fields.some((field) => field.value.includes("long overview"))).toBe(false);
  });

  it("keeps stored outcome and machine systems", () => {
    const fields = buildSummaryFields(
      baseInput({
        businessOutcome: "Reduce settlement risk for cross-border payments.",
        peopleAndSystems: [{ label: "Ledger API", kind: "Machine" }],
      }),
    );

    expect(fields.some((field) => field.label === "Business purpose" && field.value.includes("settlement"))).toBe(
      true,
    );
    expect(fields).toContainEqual({ label: "Major systems", value: "Ledger API" });
  });

  it("lists stored integration names (P-08)", () => {
    const fields = buildSummaryFields(
      baseInput({
        keyIntegrations: ["Payment gateway"],
      }),
    );

    expect(fields).toContainEqual({
      label: "Key integrations",
      value: "Payment gateway (submitted text, not operator-asserted)",
    });
  });
});
