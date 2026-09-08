import { describe, expect, it } from "vitest";

import { buildWorkingInsightsArchitectureBindEmpty } from "@/lib/architecture/working-insights-architecture-bind-empty";

describe("buildWorkingInsightsArchitectureBindEmpty (AO-30 / AO-31)", () => {
  it("AO-30: Ask empty state names the architecture and links to the desk", () => {
    const preset = buildWorkingInsightsArchitectureBindEmpty(
      {
        architectureId: "architecture-identity-001",
        displayName: "Payments platform",
        runId: null,
      },
      "ask",
    );

    expect(preset.title).toContain("Payments platform");
    expect(preset.actions?.[0]?.href).toBe("/architecture/architectures/architecture-identity-001");
    expect(preset.actions?.[1]?.href).toContain("/architecture/architectures/architecture-identity-001/reviews/new");
  });

  it("AO-31: Evidence graph empty state names the architecture desk", () => {
    const preset = buildWorkingInsightsArchitectureBindEmpty(
      {
        architectureId: "architecture-identity-001",
        displayName: "Payments platform",
        runId: null,
      },
      "evidence-graph",
    );

    expect(preset.description).toContain("Evidence graph");
    expect(preset.testId).toBe("working-insights-evidence-graph-architecture-bind-empty");
  });
});
