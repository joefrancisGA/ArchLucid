import { describe, expect, it } from "vitest";

import { remediationPatternVersionAuditTrailHref } from "@/lib/remediation-pattern-audit-trail-url";

describe("remediationPatternVersionAuditTrailHref", () => {
  it("builds audit trail search for pattern key, id, and version", () => {
    const href = remediationPatternVersionAuditTrailHref(
      "11111111-1111-1111-1111-111111111111",
      "2.0.0",
      "storage.encrypt",
    );

    const query = new URL(href, "http://localhost").searchParams.get("q");

    expect(query).toBe("storage.encrypt 11111111-1111-1111-1111-111111111111 v2.0.0");
  });
});
