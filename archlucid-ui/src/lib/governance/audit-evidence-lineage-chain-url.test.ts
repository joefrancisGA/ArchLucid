import { describe, expect, it } from "vitest";

import {
  auditEvidenceLineageChainHrefFromSearch,
  parseAuditEvidenceLineageChainOpenFromSearch,
  resolveAuditEvidenceLineageChainExpanded,
} from "@/lib/governance/audit-evidence-lineage-chain-url";

describe("audit-evidence-lineage-chain-url", () => {
  it("parses explicit open and collapsed params", () => {
    expect(parseAuditEvidenceLineageChainOpenFromSearch("1")).toBe(true);
    expect(parseAuditEvidenceLineageChainOpenFromSearch("true")).toBe(true);
    expect(parseAuditEvidenceLineageChainOpenFromSearch("0")).toBe(false);
    expect(parseAuditEvidenceLineageChainOpenFromSearch("false")).toBe(false);
    expect(parseAuditEvidenceLineageChainOpenFromSearch(null)).toBe(false);
  });

  it("defaults working seats to expanded and buyer-polished seats to collapsed", () => {
    expect(resolveAuditEvidenceLineageChainExpanded(null, false)).toBe(true);
    expect(resolveAuditEvidenceLineageChainExpanded(undefined, true)).toBe(false);
    expect(resolveAuditEvidenceLineageChainExpanded("0", false)).toBe(false);
    expect(resolveAuditEvidenceLineageChainExpanded("1", true)).toBe(true);
  });

  it("writes explicit chain params when toggling", () => {
    expect(
      auditEvidenceLineageChainHrefFromSearch("", true, "/governance/audit-evidence/a/s/c"),
    ).toBe("/governance/audit-evidence/a/s/c?lineageChainOpen=1");
    expect(
      auditEvidenceLineageChainHrefFromSearch("lineageChainOpen=1", false, "/governance/audit-evidence/a/s/c"),
    ).toBe("/governance/audit-evidence/a/s/c?lineageChainOpen=0");
  });
});
