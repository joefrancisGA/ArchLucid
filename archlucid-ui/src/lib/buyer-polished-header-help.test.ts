import { describe, expect, it } from "vitest";

import { isBuyerPolishedHeaderContextualHelpAllowed } from "@/lib/buyer-polished-header-help";

describe("isBuyerPolishedHeaderContextualHelpAllowed", () => {
  it("returns true for sponsor-oriented contextual help keys", () => {
    expect(isBuyerPolishedHeaderContextualHelpAllowed("ask-archlucid")).toBe(true);
    expect(isBuyerPolishedHeaderContextualHelpAllowed("architecture-graph")).toBe(true);
    expect(isBuyerPolishedHeaderContextualHelpAllowed("governance-workflow")).toBe(true);
    expect(isBuyerPolishedHeaderContextualHelpAllowed("audit-log")).toBe(true);
  });

  it("returns false for operator-priority keys", () => {
    expect(isBuyerPolishedHeaderContextualHelpAllowed("policy-packs")).toBe(false);
    expect(isBuyerPolishedHeaderContextualHelpAllowed("replay-run")).toBe(false);
  });
});
