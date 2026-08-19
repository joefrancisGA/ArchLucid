import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "GovernanceWorkflowPageContent.tsx"),
  "utf8",
);

describe("GovernanceWorkflowPageContent progressive disclosure", () => {
  it("keeps OperatorPageHeader first and layer guidance collapsed after the title", () => {
    expect(source.indexOf("<OperatorPageHeader")).toBeLessThan(source.indexOf("<LayerHeader"));
    expect(source).not.toContain("collapsibleChildren={");
    expect(source).not.toContain("GovernanceInteractiveQuickstartContent");
    expect(source).not.toContain("ApprovalLineageQueueVocabularyRail");
    expect(source).not.toContain("PackageGovernanceApprovalQueueVocabularyRail");
  });

  it("labels environment releases accordion and adds stable test id", () => {
    expect(source).toContain('data-testid="governance-workflow-advanced-options"');
    expect(source).toContain("GOVERNANCE_WORKFLOW_ENVIRONMENT_RELEASES_ACCORDION_LABEL");
  });

  it("labels static demo governance fallback with role=status banner", () => {
    expect(source).toContain('data-testid="governance-static-demo-fallback-status"');
    expect(source).toContain('role="status"');
    expect(source).toContain("STATIC_DEMO_GOVERNANCE_FALLBACK_STATUS");
    expect(source).toContain("warnStaticDemoPayloadFallbackOutsidePackagedDeployOnce");
  });
});
