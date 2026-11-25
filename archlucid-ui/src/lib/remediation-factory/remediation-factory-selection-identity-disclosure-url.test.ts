import { describe, expect, it } from "vitest";

import { parseRemediationFactorySelectionIdentityDisclosureOpenFromSearch } from "@/lib/remediation-factory/remediation-factory-selection-identity-disclosure-url";

describe("remediation-factory-selection-identity-disclosure-url", () => {
  it("treats yes and on selection identity disclosure tokens as open on read", () => {
    expect(parseRemediationFactorySelectionIdentityDisclosureOpenFromSearch("yes")).toBe(true);
    expect(parseRemediationFactorySelectionIdentityDisclosureOpenFromSearch("on")).toBe(true);
    expect(parseRemediationFactorySelectionIdentityDisclosureOpenFromSearch("  TRUE  ")).toBe(true);
  });
});