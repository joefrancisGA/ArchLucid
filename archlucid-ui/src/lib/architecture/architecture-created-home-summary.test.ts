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

  it("labels stored-empty key integrations separately from omitted (P-09)", () => {
    const fields = buildSummaryFields(
      baseInput({
        keyIntegrations: [],
      }),
    );

    expect(fields).toContainEqual({
      label: "Key integrations",
      value: "Integration names were not stored.",
    });
  });

  it("lists stored integration names (P-08)", () => {
    const fields = buildSummaryFields(
      baseInput({
        keyIntegrations: ["Payment gateway"],
      }),
    );

    expect(fields).toContainEqual({
      label: "Key integrations",
      value: "Payment gateway",
    });
  });

  it("shows integration narrative without treating commas as separate names (P-07)", () => {
    const fields = buildSummaryFields(
      baseInput({
        keyIntegrations: ["Payment gateway, CRM sync, and legacy batch feed"],
      }),
    );

    expect(fields).toContainEqual({
      label: "Key integrations",
      value: "Payment gateway, CRM sync, and legacy batch feed",
    });
  });

  it("labels parsed actor names once when fromSubmittedParse (P-01)", () => {
    const fields = buildSummaryFields(
      baseInput({
        peopleAndSystems: [{ label: "Payment gateway", kind: "Human", fromSubmittedParse: true }],
      }),
    );

    const primaryUsers = fields.find((field) => field.label === "Primary users")?.value ?? "";

    expect(primaryUsers).toBe("Payment gateway (submitted text, not operator-asserted)");
    expect(primaryUsers.match(/\(submitted text, not operator-asserted\)/gu)?.length).toBe(1);
  });

  it("marks Both kind on primary users and major systems lines (P-02)", () => {
    const fields = buildSummaryFields(
      baseInput({
        peopleAndSystems: [{ label: "Ops portal", kind: "Both", fromSubmittedParse: false }],
      }),
    );

    expect(fields.find((field) => field.label === "Primary users")?.value).toContain("(stored as Both)");
    expect(fields.find((field) => field.label === "Major systems")?.value).toContain("(stored as Both)");
  });

  it("labels missing actor kind on parsed primary users (P-17)", () => {
    const fields = buildSummaryFields(
      baseInput({
        peopleAndSystems: [{ label: "Claims analyst", kind: "   ", fromSubmittedParse: false }],
      }),
    );

    expect(fields.find((field) => field.label === "Primary users")?.value).toContain(
      "Claims analyst — Actor kind was not stored.",
    );
  });

  it("does not count blank actor names toward visible list overflow (P-15)", () => {
    const fields = buildSummaryFields(
      baseInput({
        peopleAndSystems: [
          { label: "Ledger API", kind: "Machine" },
          { label: "   ", kind: "Machine" },
          { label: "Billing API", kind: "Machine" },
          { label: "Claims API", kind: "Machine" },
          { label: "Auth API", kind: "Machine" },
          { label: "Notify API", kind: "Machine" },
        ],
      }),
    );

    const majorSystems = fields.find((field) => field.label === "Major systems")?.value ?? "";

    expect(majorSystems).toBe("Ledger API, Billing API, Claims API, Auth API (1 more entry was stored.)");
    expect(majorSystems).not.toContain("was not stored");
  });
});
