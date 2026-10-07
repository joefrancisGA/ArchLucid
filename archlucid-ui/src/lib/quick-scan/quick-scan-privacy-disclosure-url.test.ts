import { describe, expect, it } from "vitest";

import { parseQuickScanPrivacyDisclosureOpenFromSearch } from "./quick-scan-privacy-disclosure-url";

describe("parseQuickScanPrivacyDisclosureOpenFromSearch", () => {
  it("only treats 1 and true as open (yes stays collapsed by contract)", () => {
    expect(parseQuickScanPrivacyDisclosureOpenFromSearch("1")).toBe(true);
    expect(parseQuickScanPrivacyDisclosureOpenFromSearch("true")).toBe(true);
    expect(parseQuickScanPrivacyDisclosureOpenFromSearch("yes")).toBe(false);
  });
});
