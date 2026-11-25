import { describe, expect, it } from "vitest";

import {
  parseRemediationFactorySelectionIdentityDisclosureOpenFromSearch,
  remediationFactorySelectionIdentityDisclosureHrefFromSearch,
} from "@/lib/remediation-factory/remediation-factory-selection-identity-disclosure-url";

describe("remediation-factory-selection-identity-disclosure-url", () => {
  it("treats yes and on selection identity disclosure tokens as open on read", () => {
    expect(parseRemediationFactorySelectionIdentityDisclosureOpenFromSearch("yes")).toBe(true);
    expect(parseRemediationFactorySelectionIdentityDisclosureOpenFromSearch("on")).toBe(true);
    expect(parseRemediationFactorySelectionIdentityDisclosureOpenFromSearch("  TRUE  ")).toBe(true);
  });

  it("writes canonical 1 when opening selection identity disclosure", () => {
    const href = remediationFactorySelectionIdentityDisclosureHrefFromSearch(
      "remediationFactorySelectionIdentityOpen=yes&foreign=keep",
      true,
      "/governance/remediation-factory",
    );

    expect(href).toContain("remediationFactorySelectionIdentityOpen=1");
    expect(href).not.toContain("yes");
    expect(href).toContain("foreign=keep");
  });
});