import { describe, expect, it } from "vitest";

import { FINDINGS_HELP_RELATED_PRODUCT_DOCS } from "@/lib/findings-help-guide-content";
import { getHelpCenterTier } from "@/lib/help-center-catalog";
import { HELP_CENTER_INTERNAL_TECHNICAL_DOCUMENTATION_ALLOWLIST } from "@/lib/help-center-internal-technical-allowlist";
import { GOVERNANCE_APPROVAL_HELP_RELATED_PRODUCT_DOCS } from "@/lib/governance-approval-help-guide-content";
import { listProductDocumentationEntries } from "@/lib/product-documentation-registry";

describe("help-center internal + technical-documentation allowlist (TB-1250)", () => {
  it("forbids Help-center internal + technical-documentation without an allowlist rationale", () => {
    const violations: string[] = [];

    for (const entry of listProductDocumentationEntries()) {
      if (entry.contentKind !== "technical-documentation") {
        continue;
      }

      if (getHelpCenterTier(entry) !== "internal") {
        continue;
      }

      const rationale = HELP_CENTER_INTERNAL_TECHNICAL_DOCUMENTATION_ALLOWLIST[entry.slug];

      if (rationale === undefined || rationale.trim().length === 0) {
        violations.push(entry.slug);
      }
    }

    expect(violations).toEqual([]);
  });

  it("keep allowlist entries as internal technical-documentation with non-empty rationale", () => {
    for (const [slug, rationale] of Object.entries(HELP_CENTER_INTERNAL_TECHNICAL_DOCUMENTATION_ALLOWLIST)) {
      const entry = listProductDocumentationEntries().find((item) => item.slug === slug);

      expect(entry, slug).toBeDefined();
      expect(entry!.contentKind).toBe("technical-documentation");
      expect(getHelpCenterTier(entry!)).toBe("internal");
      expect(rationale.trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps buyer Findings/Governance related links off eng API contracts (TB-1250 / TB-1387)", () => {
    expect(FINDINGS_HELP_RELATED_PRODUCT_DOCS.href).not.toContain("governance-api-contracts");
    expect(GOVERNANCE_APPROVAL_HELP_RELATED_PRODUCT_DOCS.href).not.toContain("governance-api-contracts");
    expect(FINDINGS_HELP_RELATED_PRODUCT_DOCS.href).toBe("/help/audit-trail");
    expect(GOVERNANCE_APPROVAL_HELP_RELATED_PRODUCT_DOCS.href).toBe("/help/audit-trail");
  });
});
