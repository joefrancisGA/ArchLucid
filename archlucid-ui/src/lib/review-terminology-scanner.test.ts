import { describe, expect, it } from "vitest";

import { scanBuyerFacingTerminology } from "@/lib/review-terminology-scanner";

describe("review terminology scanner", () => {
  it("flags banned buyer-facing copy with line context", () => {
    const violations = scanBuyerFacingTerminology(
      "src/components/Example.tsx",
      `<p>Create runs from the wizard</p>`,
    );

    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]?.pattern).toBe("create runs");
  });

  it("safelists technical runId references", () => {
    const violations = scanBuyerFacingTerminology(
      "src/components/Example.tsx",
      `const href = \`/reviews/\${runId}\`;`,
    );

    expect(violations).toEqual([]);
  });
});
