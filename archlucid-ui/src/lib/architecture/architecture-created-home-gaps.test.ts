import { describe, expect, it } from "vitest";

import { buildMissingItems } from "@/lib/architecture/architecture-created-home-gaps";
import type { BuildArchitectureCreatedHomeModelInput } from "@/lib/architecture/architecture-created-home-summary";
import type { RunDetailWorkspaceStatus } from "@/lib/run-detail-workspace-derive";

function baseInput(
  overrides: Partial<BuildArchitectureCreatedHomeModelInput> = {},
): BuildArchitectureCreatedHomeModelInput {
  return {
    runId: "run-1",
    architectureName: "Payments",
    architectureOverview: "Overview",
    businessOutcome: "",
    peopleAndSystems: [],
    ownerLabel: null,
    lastUpdatedLabel: "Jul 11, 2026",
    workspaceStatus: { label: "Draft", kind: "draft", statusTagKind: "neutral" } as RunDetailWorkspaceStatus,
    assessmentInProgress: false,
    hasArtifacts: false,
    correctionHref: null,
    gapAssertion: { businessOutcome: true, peopleAndSystems: true },
    gapSourceCapturedAtUtc: null,
    ...overrides,
  };
}

describe("buildMissingItems heuristic labels (P-09)", () => {
  it("labels gaps as page checks, not stored brief facts", () => {
    const items = buildMissingItems(
      baseInput({
        businessOutcome: "",
        architectureOverview: "short",
        peopleAndSystems: [],
        architectureName: "Untitled architecture",
        hasArtifacts: false,
        assessmentInProgress: true,
      }),
    );

    expect(items.some((item) => item.label.includes("on this page"))).toBe(true);
    expect(items.some((item) => item.label === "Business outcome is still brief or missing")).toBe(false);
  });
});

describe("buildMissingItems artifact honesty (P-14)", () => {
  it("does not claim evidence was not uploaded when the artifact list was omitted", () => {
    const items = buildMissingItems(
      baseInput({
        artifactBundleKnown: false,
        hasArtifacts: false,
      }),
    );

    expect(items.some((item) => item.label.includes("not uploaded"))).toBe(false);
    expect(items.some((item) => item.id === "artifact-bundle-unknown")).toBe(true);
  });
});

describe("buildMissingItems people and systems (P-17)", () => {
  it("surfaces stored-empty list copy when the system name is stored", () => {
    const items = buildMissingItems(
      baseInput({
        architectureName: "Payments",
        peopleAndSystems: [],
      }),
    );

    expect(items.find((item) => item.id === "people-systems")?.label).toContain("stored empty");
  });
});

describe("buildMissingItems system name (P-16)", () => {
  it("surfaces a system-name page check when architecture name is blank", () => {
    const items = buildMissingItems(
      baseInput({
        architectureName: "   ",
      }),
    );

    expect(items.some((item) => item.id === "system-name")).toBe(true);
    expect(items.find((item) => item.id === "system-name")?.label).toContain("System name");
  });
});
