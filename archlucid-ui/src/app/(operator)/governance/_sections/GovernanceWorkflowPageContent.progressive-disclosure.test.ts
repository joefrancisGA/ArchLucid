import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sectionsDir = dirname(fileURLToPath(import.meta.url));
const contentSource = readFileSync(join(sectionsDir, "GovernanceWorkflowPageContent.tsx"), "utf8");
const shellSource = readFileSync(join(sectionsDir, "GovernanceWorkflowPageShell.tsx"), "utf8");
const tabsSource = readFileSync(join(sectionsDir, "use-governance-workflow-page-tabs.ts"), "utf8");

describe("GovernanceWorkflowPageContent progressive disclosure", () => {
  it("keeps the page content module composition-only", () => {
    expect(contentSource).toContain("GovernanceWorkflowPageShell");
    expect(contentSource).toContain("useGovernanceWorkflowPage");
    expect(contentSource).not.toContain("<OperatorPageHeader");
  });

  it("keeps OperatorPageHeader first and layer guidance collapsed after the title", () => {
    expect(shellSource.indexOf("<OperatorPageHeader")).toBeLessThan(shellSource.indexOf("<LayerHeader"));
    expect(shellSource).not.toContain("collapsibleChildren={");
    expect(shellSource).not.toContain("GovernanceInteractiveQuickstartContent");
    expect(shellSource).not.toContain("ApprovalLineageQueueVocabularyRail");
    expect(shellSource).not.toContain("PackageGovernanceApprovalQueueVocabularyRail");
  });

  it("labels environment releases accordion and adds stable test id", () => {
    expect(shellSource).toContain('data-testid="governance-workflow-advanced-options"');
    expect(shellSource).toContain("GOVERNANCE_WORKFLOW_ENVIRONMENT_RELEASES_ACCORDION_LABEL");
  });

  it("labels static demo governance fallback with role=status banner", () => {
    expect(shellSource).toContain('data-testid="governance-static-demo-fallback-status"');
    expect(shellSource).toContain('role="status"');
    expect(shellSource).toContain("STATIC_DEMO_GOVERNANCE_FALLBACK_STATUS");
    expect(tabsSource).toContain("warnStaticDemoPayloadFallbackOutsidePackagedDeployOnce");
  });
});
