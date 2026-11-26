import { describe, expect, it } from "vitest";

import {
  parseRemediationFactorySnapshotIdentityDisclosureOpenFromSearch,
  remediationFactorySnapshotIdentityDisclosureHrefFromSearch,
} from "@/lib/remediation-factory/remediation-factory-snapshot-identity-disclosure-url";

describe("remediation-factory-snapshot-identity-disclosure-url", () => {
  it("treats yes and on snapshot identity disclosure tokens as open on read", () => {
    expect(parseRemediationFactorySnapshotIdentityDisclosureOpenFromSearch("yes")).toBe(true);
    expect(parseRemediationFactorySnapshotIdentityDisclosureOpenFromSearch("on")).toBe(true);
    expect(parseRemediationFactorySnapshotIdentityDisclosureOpenFromSearch("  TRUE  ")).toBe(true);
  });

  it("preserves foreign query params when toggling snapshot identity disclosure", () => {
    const href = remediationFactorySnapshotIdentityDisclosureHrefFromSearch(
      "remediationFactorySnapshotIdentityOpen=1&foreign=keep",
      false,
      "/governance/remediation-factory",
    );

    expect(href).toContain("foreign=keep");
    expect(href).not.toContain("remediationFactorySnapshotIdentityOpen");
  });
});