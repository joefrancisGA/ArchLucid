import { describe, expect, it } from "vitest";

import { resolveSecureNowCollectionRecoveryLinkLabel } from "./securenow-collection-recovery-copy";

describe("resolveSecureNowCollectionRecoveryLinkLabel", () => {
  it("names the reader grant as the provider next step", () => {
    expect(resolveSecureNowCollectionRecoveryLinkLabel("provider")).toBe(
      "Grant Reader on one subscription",
    );
    expect(resolveSecureNowCollectionRecoveryLinkLabel("subscription")).toBe(
      "Select one Azure subscription",
    );
    expect(resolveSecureNowCollectionRecoveryLinkLabel("capture")).toBe("Run or upload a capture");
  });
});
