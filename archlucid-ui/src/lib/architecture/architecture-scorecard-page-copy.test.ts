import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_SCORECARD_CANONICAL_PATH,
  ARCHITECTURE_SCORECARD_CLAIM_DISCIPLINE,
  ARCHITECTURE_SCORECARD_SOURCES,
} from "@/lib/architecture/architecture-scorecard-page-copy";

describe("architecture-scorecard-page-copy", () => {
  it("keeps Sources off the scorecard self-path and states directional claim discipline", () => {
    expect(
      ARCHITECTURE_SCORECARD_SOURCES.some((link) => link.href === ARCHITECTURE_SCORECARD_CANONICAL_PATH),
    ).toBe(false);
    expect(ARCHITECTURE_SCORECARD_SOURCES.some((link) => link.href === "/insights/roi-summary")).toBe(
      true,
    );
    expect(ARCHITECTURE_SCORECARD_CLAIM_DISCIPLINE.toLowerCase()).toContain("directional");
    expect(ARCHITECTURE_SCORECARD_CLAIM_DISCIPLINE.toLowerCase()).not.toContain("cpa");
    expect(ARCHITECTURE_SCORECARD_CLAIM_DISCIPLINE.toLowerCase()).not.toMatch(/diligence sources/i);
  });
});
