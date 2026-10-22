import { describe, expect, it } from "vitest";

import { contextualHelpForPathname } from "@/lib/contextual-help/registry";
import { SECURENOW_REMEDIATION_FACTORY_PATH } from "@/lib/governance/governance-route-paths";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

function joinedHelpText(entry: ReturnType<typeof contextualHelpForPathname>): string {
  return [entry?.whatToDoNext, ...(entry?.taskSteps ?? [])].join(" ");
}

describe("SecureNow findings desk path inspect help", () => {
  it("documents path inspect on compliance findings and assigned-to-me", () => {
    const compliance = contextualHelpForPathname("/compliance/findings", { productLineId: "security" });
    const assigned = contextualHelpForPathname("/security/assigned-to-me", { productLineId: "security" });

    expect(joinedHelpText(compliance)).toMatch(/path inspect/i);
    expect(joinedHelpText(compliance)).toMatch(/Alt\+I/i);
    expect(joinedHelpText(compliance)).toMatch(/Focus path inspect/i);
    expect(joinedHelpText(assigned)).toMatch(/path inspect/i);
    expect(joinedHelpText(assigned)).toMatch(/Alt\+I/i);
  });

  it("does not add path inspect to architecture governance findings", () => {
    const architectureFindings = contextualHelpForPathname("/governance/findings", {
      productLineId: "architecture",
    });
    const text = joinedHelpText(architectureFindings);

    expect(text).not.toMatch(/path inspect/i);
    expect(text).not.toMatch(/Alt\+I/i);
  });

  it("keeps remediation factory advisory copy and mentions findings desks", () => {
    const factory = contextualHelpForPathname(SECURENOW_REMEDIATION_FACTORY_PATH, { productLineId: "security" });

    expect(factory?.whatIsThisPage).toContain("Advisory only");
    expect(factory?.whatToDoNext).toMatch(/Findings/i);
    expect(factory?.whatToDoNext).toMatch(/Assigned to me/i);
    expect(factory?.whatIsThisPage).not.toContain("Approval");
  });

  it("extends the security-evidence-paths registry summary for findings desks", () => {
    const entry = getProductDocumentationEntry("security-evidence-paths");

    expect(entry?.summary).toMatch(/Findings/i);
    expect(entry?.summary).toMatch(/Assigned to me/i);
    expect(entry?.summary ?? "").not.toMatch(/%/);
  });
});
