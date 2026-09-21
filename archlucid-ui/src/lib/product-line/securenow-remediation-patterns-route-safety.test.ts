import { describe, expect, it } from "vitest";

import { GOVERNANCE_REMEDIATION_PATTERNS_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/governance-remediation-patterns-contextual-help-rows";
import {
  GOVERNANCE_REMEDIATION_PATTERNS_PATH,
  SECURENOW_REMEDIATION_PATTERNS_PATH,
} from "@/lib/governance/governance-route-paths";
import { isPathAllowedForProductLine } from "@/lib/product-line/product-line-path-access";
import {
  isRemediationPatternsRoutePath,
  remediationPatternsPathForProductLine,
} from "@/lib/product-line/securenow-remediation-patterns-route";

describe("securenow-remediation-patterns-route-safety", () => {
  it("routes SecureNow to /security/remediation-patterns only", () => {
    expect(remediationPatternsPathForProductLine("security")).toBe(SECURENOW_REMEDIATION_PATTERNS_PATH);
    expect(remediationPatternsPathForProductLine("architecture")).toBe(GOVERNANCE_REMEDIATION_PATTERNS_PATH);
  });

  it("gates SecureNow remediation patterns path by product line", () => {
    expect(isPathAllowedForProductLine(SECURENOW_REMEDIATION_PATTERNS_PATH, "security")).toBe(true);
    expect(isPathAllowedForProductLine(SECURENOW_REMEDIATION_PATTERNS_PATH, "architecture")).toBe(false);
    expect(isPathAllowedForProductLine(GOVERNANCE_REMEDIATION_PATTERNS_PATH, "architecture")).toBe(true);
    expect(isPathAllowedForProductLine(GOVERNANCE_REMEDIATION_PATTERNS_PATH, "security")).toBe(true);
  });

  it("registers contextual help on both pattern paths without architecture-review leaks", () => {
    const prefixes = GOVERNANCE_REMEDIATION_PATTERNS_CONTEXTUAL_HELP_ROWS.map((row) => row.prefix);

    expect(prefixes).toContain(SECURENOW_REMEDIATION_PATTERNS_PATH);
    expect(prefixes).toContain(GOVERNANCE_REMEDIATION_PATTERNS_PATH);

    const hrefs = GOVERNANCE_REMEDIATION_PATTERNS_CONTEXTUAL_HELP_ROWS.flatMap((row) => {
      const entry = row.entry;
      const actions = [entry.whatToDoNextAction?.href, entry.whereToConfigureAction?.href].filter(
        (href): href is string => href !== undefined,
      );

      return actions;
    });

    for (const href of hrefs) {
      expect(href.startsWith("/architecture/reviews")).toBe(false);
    }
  });

  it("recognizes canonical remediation pattern route paths", () => {
    expect(isRemediationPatternsRoutePath(SECURENOW_REMEDIATION_PATTERNS_PATH)).toBe(true);
    expect(isRemediationPatternsRoutePath("/security/remediation-patterns/extra")).toBe(false);
  });
});
