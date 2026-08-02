import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "GovernanceWorkflowPageContent.tsx"),
  "utf8",
);

describe("GovernanceWorkflowPageContent progressive disclosure", () => {
  it("merges first-time quickstart into the layer header accordion on overview", () => {
    expect(source).toContain("collapsibleChildren={");
    expect(source).toContain("GovernanceInteractiveQuickstartContent");
    expect(source).not.toContain("AdvancedOptionsAccordion triggerLabel={GOVERNANCE_OVERVIEW_HOW_IT_WORKS_TRIGGER}");
    expect(source).not.toMatch(/\)\s*:\s*\(\s*\n\s*<GovernanceInteractiveQuickstartCard \/>/);
  });

  it("labels environment releases accordion and adds stable test id", () => {
    expect(source).toContain('data-testid="governance-workflow-advanced-options"');
    expect(source).toContain("GOVERNANCE_WORKFLOW_ENVIRONMENT_RELEASES_ACCORDION_LABEL");
  });

  it("labels static demo governance fallback with role=status banner", () => {
    expect(source).toContain('data-testid="governance-static-demo-fallback-status"');
    expect(source).toContain('role="status"');
    expect(source).toContain("STATIC_DEMO_GOVERNANCE_FALLBACK_STATUS");
    expect(source).toContain("shouldSeedStaticDemoGovernanceRecordsForRun");
    expect(source).toContain("warnStaticDemoPayloadFallbackOutsidePackagedDeployOnce");
  });
});
