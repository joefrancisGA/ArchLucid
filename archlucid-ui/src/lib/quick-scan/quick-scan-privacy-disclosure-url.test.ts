import { describe, expect, it } from "vitest";

import {
  parseQuickScanPrivacyDisclosureOpenFromSearch,
  quickScanPrivacyDisclosureHrefFromSearch,
} from "./quick-scan-privacy-disclosure-url";

describe("parseQuickScanPrivacyDisclosureOpenFromSearch", () => {
  it("preserves unrelated query params when toggling disclosure", () => {
    expect(quickScanPrivacyDisclosureHrefFromSearch("utm_source=email", true, "/quick-scan")).toBe(
      "/quick-scan?utm_source=email&quickScanPrivacyDisclosureOpen=1",
    );
    expect(quickScanPrivacyDisclosureHrefFromSearch("utm_source=email&quickScanPrivacyDisclosureOpen=1", false, "/quick-scan")).toBe(
      "/quick-scan?utm_source=email",
    );
  });

  it("only treats 1 and true as open (yes stays collapsed by contract)", () => {
    expect(parseQuickScanPrivacyDisclosureOpenFromSearch("1")).toBe(true);
    expect(parseQuickScanPrivacyDisclosureOpenFromSearch("true")).toBe(true);
    expect(parseQuickScanPrivacyDisclosureOpenFromSearch("yes")).toBe(false);
  });
});
