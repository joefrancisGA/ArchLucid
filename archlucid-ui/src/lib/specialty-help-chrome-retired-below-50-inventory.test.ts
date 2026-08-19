import { describe, expect, it } from "vitest";

import { resolveHelpTopicPermanentRedirect } from "@/lib/help/help-topic-permanent-redirects";
import { SPECIALTY_HELP_CHROME_RETIRED_BELOW_50_INVENTORY } from "@/lib/specialty-help-chrome-retired-below-50-inventory";

describe("specialty help chrome retired ≤~50 inventory (TB-1414 pass)", () => {
  it("documents retired alias folds without permanent redirects", () => {
    expect(SPECIALTY_HELP_CHROME_RETIRED_BELOW_50_INVENTORY).toHaveLength(2);

    for (const entry of SPECIALTY_HELP_CHROME_RETIRED_BELOW_50_INVENTORY) {
      expect(entry.approximateScore).toBeLessThanOrEqual(50);
      expect(resolveHelpTopicPermanentRedirect(entry.retiredSlug)).toBeNull();
      expect(entry.retiredHelpPath).toBe(`/help/${entry.retiredSlug}`);
      expect(entry.canonicalHelpPath).toBe(`/help/${entry.canonicalSlug}`);
    }
  });
});
