import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { readDeferredChunkImportLoaderSource } from "@/lib/operator/deferred-chunk-import-loader-source.test-helper";

const routeDir = dirname(fileURLToPath(import.meta.url));
const sectionsDir = join(routeDir, "..", "_sections");

const pageSource = readFileSync(join(routeDir, "page.tsx"), "utf8");
const pageContentSource = readFileSync(join(sectionsDir, "GovernanceWorkflowPageShell.tsx"), "utf8");
const deferredSource = readFileSync(join(sectionsDir, "governance-workflow-deferred-chunks.tsx"), "utf8");
const mutationHostSource = readFileSync(join(sectionsDir, "GovernanceWorkflowMutationHost.tsx"), "utf8");
const manifestLoaderSource = readDeferredChunkImportLoaderSource();

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

describe("approval-queue deferred imports (TB-934 / wave 10)", () => {
  it("keeps GovernanceWorkflowPageContent off the page static import graph", () => {
    expect(pageSource).not.toContain(
      'import { GovernanceWorkflowPageContent } from "../_sections/GovernanceWorkflowPageContent"',
    );
    expect(pageSource).toContain("GovernanceWorkflowPageContentDeferred");
    expect(pageSource).not.toContain("next/dynamic");
    expect(pageSource).not.toContain('"use client"');
  });

  it("keeps below-fold workflow panels off the page shell static import graph", () => {
    for (const bannedImport of bannedStaticImports) {
      expect(pageContentSource).not.toContain(bannedImport);
    }

    expect(pageContentSource).toContain("governance-workflow-deferred-chunks");
    expect(pageContentSource).toContain("GovernanceOverviewPanelDeferred");
    expect(pageContentSource).toContain("GovernanceReviewContextBarDeferred");
    expect(pageContentSource).toContain("GovernanceWorkflowSubmitSectionDeferred");
    expect(pageContentSource).toContain("GovernanceWorkflowApprovalsListDeferred");
    expect(pageContentSource).toContain("GovernanceWorkflowPromotionsActivationsSectionDeferred");
    expect(pageContentSource).not.toContain("GovernanceWorkflowDialogsDeferred");
    expect(mutationHostSource).toContain("GovernanceWorkflowDialogsDeferred");
    expect(pageContentSource).toContain("CtoDemoBuyerValueStripDeferred");
    expect(pageContentSource).toContain("CtoDemoSegregationCalloutDeferred");
    expect(pageContentSource).toContain("CtoDemoGovernancePreviewHintDeferred");
    expect(pageContentSource).toContain("GovernanceApprovalStoryCardDeferred");
    expect(pageContentSource).toContain("AdvancedOptionsAccordionDeferred");
  });

  it("dynamic-imports deferred governance workflow panels via manifest loaders", () => {
    expect(deferredSource).toContain("createDeferredComponentFromManifest");
    expect(deferredSource).not.toContain("next/dynamic");
    expect(manifestLoaderSource).toContain('import("@/app/(operator)/governance/_sections/GovernanceOverviewPanel")');
    expect(manifestLoaderSource).toContain('import("@/app/(operator)/governance/_sections/GovernanceReviewContextBar")');
    expect(manifestLoaderSource).toContain('import("@/app/(operator)/governance/_sections/GovernanceWorkflowSubmitSection")');
    expect(manifestLoaderSource).toContain('import("@/app/(operator)/governance/_sections/GovernanceWorkflowApprovalsList")');
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/governance/_sections/GovernanceWorkflowPromotionsActivationsSection")',
    );
    expect(manifestLoaderSource).toContain('import("@/app/(operator)/governance/_sections/GovernanceWorkflowDialogs")');
    expect(manifestLoaderSource).toContain('import("@/components/cto-demo/CtoDemoBuyerValueStrip")');
    expect(manifestLoaderSource).toContain('import("@/components/cto-demo/CtoDemoSegregationCallout")');
    expect(manifestLoaderSource).toContain('import("@/components/OperateCapabilityHints")');
    expect(manifestLoaderSource).toContain('import("@/components/governance/GovernanceInteractiveQuickstartContent")');
    expect(manifestLoaderSource).toContain('import("@/components/governance/GovernanceApprovalStoryCard")');
    expect(manifestLoaderSource).toContain('import("@/components/AdvancedOptionsAccordion")');
    expect(deferredSource).toContain("GovernanceApprovalStoryCardDeferred");
    expect(deferredSource).toContain("GovernanceReviewContextBarDeferred");
    expect(deferredSource).toContain("AdvancedOptionsAccordionDeferred");
    expect(deferredSource).toContain("governance-workflow-cto-demo-buyer-value-strip");
    expect(deferredSource).toContain("governance-workflow-cto-demo-segregation-callout");
    expect(deferredSource).toContain("governance-workflow-cto-demo-governance-preview-hint");
    expect(deferredSource).toContain("governance-workflow-page-content");
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/governance/_sections/GovernanceWorkflowPageContent")',
    );
  });
});
