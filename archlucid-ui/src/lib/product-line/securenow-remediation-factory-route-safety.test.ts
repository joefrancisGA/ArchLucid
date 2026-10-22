import { describe, expect, it } from "vitest";

import { GOVERNANCE_REMEDIATION_FACTORY_CONTEXTUAL_HELP_ROWS } from "@/lib/contextual-help/governance-remediation-factory-contextual-help-rows";
import {
  GOVERNANCE_REMEDIATION_FACTORY_PATH,
  SECURENOW_REMEDIATION_FACTORY_PATH,
} from "@/lib/governance/governance-route-paths";
import {
  isRemediationFactoryRoutePath,
  remediationFactoryPathForProductLine,
} from "@/lib/product-line/securenow-remediation-factory-route";

describe("securenow-remediation-factory-route-safety", () => {
  it("routes SecureNow to /security/remediation-factory only", () => {
    expect(remediationFactoryPathForProductLine("security")).toBe(SECURENOW_REMEDIATION_FACTORY_PATH);
    expect(remediationFactoryPathForProductLine("architecture")).toBe(GOVERNANCE_REMEDIATION_FACTORY_PATH);
  });

  it("registers contextual help on both factory paths without architecture-review leaks", () => {
    const prefixes = GOVERNANCE_REMEDIATION_FACTORY_CONTEXTUAL_HELP_ROWS.map((row) => row.prefix);

    expect(prefixes).toContain(SECURENOW_REMEDIATION_FACTORY_PATH);
    expect(prefixes).toContain(GOVERNANCE_REMEDIATION_FACTORY_PATH);

    const hrefs = GOVERNANCE_REMEDIATION_FACTORY_CONTEXTUAL_HELP_ROWS.flatMap((row) => {
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

  it("recognizes canonical remediation factory route paths", () => {
    expect(isRemediationFactoryRoutePath(SECURENOW_REMEDIATION_FACTORY_PATH)).toBe(true);
    expect(isRemediationFactoryRoutePath("/security/remediation-factory/extra")).toBe(false);
  });
});
