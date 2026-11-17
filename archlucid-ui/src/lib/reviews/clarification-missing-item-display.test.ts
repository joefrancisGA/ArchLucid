import { describe, expect, it } from "vitest";

import { formatClarificationMissingItemDisplay } from "@/lib/reviews/clarification-missing-item-display";

describe("formatClarificationMissingItemDisplay", () => {
  it("labels ARM and GUID missing items with stored reference honesty", () => {
    expect(formatClarificationMissingItemDisplay(null)).toBe("Missing item was not stored.");
    expect(formatClarificationMissingItemDisplay("")).toBe("Missing item was stored empty.");
    expect(formatClarificationMissingItemDisplay("/subscriptions/x/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1")).toContain(
      "Resource name was not stored",
    );
    expect(formatClarificationMissingItemDisplay("11111111-1111-1111-1111-111111111111")).toContain(
      "GUID without a display name",
    );
  });
});
