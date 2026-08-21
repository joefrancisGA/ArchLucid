import { describe, expect, it } from "vitest";

import {
  buildArchitectureActivityFinalizeReadinessHref,
  buildArchitectureGovernanceFinalizeReadinessHref,
} from "@/lib/architecture/architecture-created-finalize-readiness-href";

describe("architecture-created-finalize-readiness-href", () => {
  it("routes findings finalize readiness to governance tab", () => {
    const href = buildArchitectureGovernanceFinalizeReadinessHref("run-1");

    expect(href).toContain("reviewTab=policies");
    expect(href).toContain("fromGeneration=1");
  });

  it("routes governance primary CTA to activity finalize anchor", () => {
    const href = buildArchitectureActivityFinalizeReadinessHref("run-1");

    expect(href).toContain("reviewTab=activity");
    expect(href).toContain("#architecture-assessment-progress");
  });
});
