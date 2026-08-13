import { describe, expect, it } from "vitest";

import { assessArchitectureDiagramReadiness } from "@/lib/architecture/architecture-diagram-readiness";
import { parseArchitectureGeneratedContent } from "@/lib/architecture/architecture-generated-content-parser";

describe("assessArchitectureDiagramReadiness", () => {
  it("is sufficient when major components and users are present", () => {
    const parseResult = parseArchitectureGeneratedContent(
      `## Systems and services
- Claims API
## Users and stakeholders
- Claims analyst`,
      {
        architectureName: "Claims platform",
        architectureOverview: "Overview",
        businessOutcome: "Outcome",
        peopleAndSystems: [{ label: "Claims analyst", kind: "Human" }],
      },
    );

    const readiness = assessArchitectureDiagramReadiness(parseResult, "Claims platform");

    expect(readiness.sufficient).toBe(true);
    expect(readiness.activeNodeCount).toBeGreaterThanOrEqual(2);
  });

  it("is insufficient when only one component is known", () => {
    const parseResult = parseArchitectureGeneratedContent("## Systems and services\n- Solo API", null);
    const readiness = assessArchitectureDiagramReadiness(parseResult, "Untitled architecture");

    expect(readiness.sufficient).toBe(false);
    expect(readiness.missingCategories).toContain("users-or-initiators");
  });
});
