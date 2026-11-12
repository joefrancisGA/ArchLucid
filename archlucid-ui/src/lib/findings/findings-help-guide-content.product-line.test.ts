import { describe, expect, it } from "vitest";

import {
  FINDINGS_HELP_PRIMARY_ACTIONS,
  SECURENOW_FINDINGS_HELP_PRIMARY_ACTIONS,
  findingsHelpEvidenceActions,
  findingsHelpPrimaryActions,
} from "@/lib/findings/findings-help-guide-content";
import {
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_RESOLUTION_PATH,
  SECURENOW_FINDINGS_PATH,
  SECURENOW_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance/governance-route-paths";

describe("findings-help-guide-content product-line routes", () => {
  it("keeps architecture primary actions on governance findings", () => {
    expect(findingsHelpPrimaryActions("architecture").openFindings.href).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(FINDINGS_HELP_PRIMARY_ACTIONS.openFindings.href).toBe(GOVERNANCE_FINDINGS_PATH);
  });

  it("routes SecureNow primary actions to compliance findings", () => {
    expect(findingsHelpPrimaryActions("security").openFindings.href).toBe(SECURENOW_FINDINGS_PATH);
    expect(SECURENOW_FINDINGS_HELP_PRIMARY_ACTIONS.openFindings.href).toBe(SECURENOW_FINDINGS_PATH);
  });

  it("routes SecureNow evidence actions to compliance standards and rules", () => {
    const standardsAction = findingsHelpEvidenceActions("security").find(
      (action) => action.label === "Browse standards and rules",
    );

    expect(standardsAction?.href).toBe(SECURENOW_STANDARDS_AND_RULES_PATH);
    expect(standardsAction?.href).not.toBe(GOVERNANCE_RESOLUTION_PATH);
  });
});
