import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const routeDir = dirname(fileURLToPath(import.meta.url));
const sectionsDir = join(routeDir, "..", "_sections");

const pageSource = readFileSync(join(routeDir, "page.tsx"), "utf8");
const pageContentSource = readFileSync(join(sectionsDir, "GovernanceWorkflowPageContent.tsx"), "utf8");
const deferredSource = readFileSync(join(sectionsDir, "governance-workflow-deferred-chunks.tsx"), "utf8");

const bannedStaticImports = [
  './GovernanceOverviewPanel"',
  './GovernanceReviewContextBar"',
  './GovernanceWorkflowSubmitSection"',
  './GovernanceWorkflowApprovalsList"',
  './GovernanceWorkflowPromotionsActivationsSection"',
  './GovernanceWorkflowDialogs"',
  '@/components/cto-demo/CtoDemoBuyerValueStrip"',
  '@/components/cto-demo/CtoDemoSegregationCallout"',
  '@/components/OperateCapabilityHints"',
  '@/components/governance/GovernanceInteractiveQuickstartContent"',
  '@/components/governance/GovernanceApprovalStoryCard"',
  '@/components/AdvancedOptionsAccordion"',
] as const;

describe("governance approval-queue deferred imports (TB-934 / wave 10)", () => {
  it("keeps GovernanceWorkflowPageContent off the page static import graph", () => {
    expect(pageSource).not.toContain(
      'import { GovernanceWorkflowPageContent } from "../_sections/GovernanceWorkflowPageContent"',
    );
    expect(pageSource).toContain('import("../_sections/GovernanceWorkflowPageContent")');
    expect(pageSource).toContain("next/dynamic");
    expect(pageSource).not.toContain('"use client"');
  });

  it("keeps below-fold workflow panels off the content static import graph", () => {
    for (const bannedImport of bannedStaticImports) {
      expect(pageContentSource).not.toContain(bannedImport);
    }

    expect(pageContentSource).toContain("governance-workflow-deferred-chunks");
    expect(pageContentSource).toContain("GovernanceOverviewPanelDeferred");
    expect(pageContentSource).toContain("GovernanceReviewContextBarDeferred");
    expect(pageContentSource).toContain("GovernanceWorkflowSubmitSectionDeferred");
    expect(pageContentSource).toContain("GovernanceWorkflowApprovalsListDeferred");
    expect(pageContentSource).toContain("GovernanceWorkflowPromotionsActivationsSectionDeferred");
    expect(pageContentSource).toContain("GovernanceWorkflowDialogsDeferred");
    expect(pageContentSource).toContain("CtoDemoBuyerValueStripDeferred");
    expect(pageContentSource).toContain("CtoDemoSegregationCalloutDeferred");
    expect(pageContentSource).toContain("CtoDemoGovernancePreviewHintDeferred");
    expect(pageContentSource).toContain("GovernanceApprovalStoryCardDeferred");
    expect(pageContentSource).toContain("AdvancedOptionsAccordionDeferred");
  });

  it("dynamic-imports each deferred governance workflow panel", () => {
    expect(deferredSource).toContain("next/dynamic");
    expect(deferredSource).toContain('import("./GovernanceOverviewPanel")');
    expect(deferredSource).toContain('import("./GovernanceReviewContextBar")');
    expect(deferredSource).toContain('import("./GovernanceWorkflowSubmitSection")');
    expect(deferredSource).toContain('import("./GovernanceWorkflowApprovalsList")');
    expect(deferredSource).toContain('import("./GovernanceWorkflowPromotionsActivationsSection")');
    expect(deferredSource).toContain('import("./GovernanceWorkflowDialogs")');
    expect(deferredSource).toContain('import("@/components/cto-demo/CtoDemoBuyerValueStrip")');
    expect(deferredSource).toContain('import("@/components/cto-demo/CtoDemoSegregationCallout")');
    expect(deferredSource).toContain('import("@/components/OperateCapabilityHints")');
    expect(deferredSource).toContain('import("@/components/governance/GovernanceInteractiveQuickstartContent")');
    expect(deferredSource).toContain('import("@/components/governance/GovernanceApprovalStoryCard")');
    expect(deferredSource).toContain('import("@/components/AdvancedOptionsAccordion")');
    expect(deferredSource).toContain("GovernanceApprovalStoryCardDeferred");
    expect(deferredSource).toContain("GovernanceReviewContextBarDeferred");
    expect(deferredSource).toContain("AdvancedOptionsAccordionDeferred");
  });
});
