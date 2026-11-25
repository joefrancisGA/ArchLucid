import { describe, expect, it } from "vitest";

import { parseRemediationFactorySnapshotIdentityDisclosureOpenFromSearch } from "@/lib/remediation-factory/remediation-factory-snapshot-identity-disclosure-url";

describe("remediation-factory-snapshot-identity-disclosure-url", () => {
  it("treats yes and on snapshot identity disclosure tokens as open on read", () => {
    expect(parseRemediationFactorySnapshotIdentityDisclosureOpenFromSearch("yes")).toBe(true);
    expect(parseRemediationFactorySnapshotIdentityDisclosureOpenFromSearch("on")).toBe(true);
    expect(parseRemediationFactorySnapshotIdentityDisclosureOpenFromSearch("  TRUE  ")).toBe(true);
  });
});