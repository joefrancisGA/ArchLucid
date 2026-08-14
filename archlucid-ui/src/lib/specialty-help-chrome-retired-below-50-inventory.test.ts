import { describe, expect, it } from "vitest";

import { HELP_TOPIC_PERMANENT_REDIRECTS } from "@/lib/help/help-topic-permanent-redirects";
import { SPECIALTY_HELP_CHROME_RETIRED_BELOW_50_INVENTORY } from "@/lib/specialty-help-chrome-retired-below-50-inventory";

describe("specialty help chrome retired ≤~50 inventory (TB-1414 pass)", () => {
  it("documents retired alias folds with permanent redirect targets", () => {
    expect(SPECIALTY_HELP_CHROME_RETIRED_BELOW_50_INVENTORY).toHaveLength(2);

    for (const entry of SPECIALTY_HELP_CHROME_RETIRED_BELOW_50_INVENTORY) {
      expect(entry.approximateScore).toBeLessThanOrEqual(50);
      expect(HELP_TOPIC_PERMANENT_REDIRECTS[entry.retiredSlug]).toBe(entry.canonicalHelpPath);
      expect(entry.retiredHelpPath).toBe(`/help/${entry.retiredSlug}`);
      expect(entry.canonicalHelpPath).toBe(`/help/${entry.canonicalSlug}`);
    }
  });
});
