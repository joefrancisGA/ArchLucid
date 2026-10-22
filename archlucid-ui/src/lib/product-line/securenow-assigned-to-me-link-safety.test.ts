import { describe, expect, it } from "vitest";

import { GOVERNANCE_ASSIGNED_TO_ME_ORIENTATION_SOURCES } from "@/lib/governance/governance-assigned-to-me-evidence-copy";
import { SECURENOW_GOVERNANCE_ASSIGNED_TO_ME_ORIENTATION_SOURCES } from "@/lib/product-line/securenow-governance-assigned-to-me-evidence-copy";

const BLOCKED_SECURENOW_HREF_PREFIXES = ["/architecture/", "/pricing"];

function assertSecureNowLinkSafety(hrefs: readonly string[]): void {
  for (const href of hrefs) {
    expect(BLOCKED_SECURENOW_HREF_PREFIXES.some((prefix) => href.startsWith(prefix))).toBe(false);
    expect(href).not.toBe("/pricing");
  }
}

describe("securenow-assigned-to-me-link-safety", () => {
  it("documents architecture orientation leaks avoided on SecureNow assigned-to-me", () => {
    const architectureHrefs = GOVERNANCE_ASSIGNED_TO_ME_ORIENTATION_SOURCES.map((source) => source.href);
    expect(architectureHrefs.some((href) => href.startsWith("/architecture/"))).toBe(true);

    const secureNowHrefs = SECURENOW_GOVERNANCE_ASSIGNED_TO_ME_ORIENTATION_SOURCES.map((source) => source.href);
    assertSecureNowLinkSafety(secureNowHrefs);
  });
});
