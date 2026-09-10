import { describe, expect, it } from "vitest";

import { resolveProvenanceInspectSteps } from "@/lib/provenance-inspect-checklist";

describe("resolveProvenanceInspectSteps", () => {
  it("uses selected-package label when a review is already scoped", () => {
    const steps = resolveProvenanceInspectSteps({
      reviewPicked: true,
      provenanceLoaded: true,
      inspectComplete: false,
    });

    expect(steps[0]?.label).toBe("Architecture package selected");
  });

  it("keeps pick-package label when no review is scoped", () => {
    const steps = resolveProvenanceInspectSteps({
      reviewPicked: false,
      provenanceLoaded: false,
      inspectComplete: false,
    });

    expect(steps[0]?.label).toBe("Pick an architecture package");
  });
});
