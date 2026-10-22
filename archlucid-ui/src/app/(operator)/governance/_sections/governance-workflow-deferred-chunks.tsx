"use client";

import type { ComponentType, JSX } from "react";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

import type { GovernanceOverviewPanelProps } from "./GovernanceOverviewPanel";
import type { GovernanceReviewContextBarProps } from "./GovernanceReviewContextBar";
import type { GovernanceWorkflowSubmitSectionProps } from "./GovernanceWorkflowSubmitSection";

/** Overview panel — deferred so approval-queue chrome paints first (wave 11 hub First Load). */
export const GovernanceOverviewPanelDeferred: ComponentType<GovernanceOverviewPanelProps> =
  createDeferredComponentFromManifest("governance-workflow-overview-panel", {
    loadingTestId: "governance-workflow-deferred-chunk-loading",
  });

/** Review context bar — deferred so approval-queue header paints first (wave 14 First Load). */
export const GovernanceReviewContextBarDeferred: ComponentType<GovernanceReviewContextBarProps> =
  createDeferredComponentFromManifest("governance-workflow-review-context-bar", {
    loadingTestId: "governance-workflow-deferred-chunk-loading",
  });

export const GovernanceWorkflowSubmitSectionDeferred: ComponentType<GovernanceWorkflowSubmitSectionProps> =
  createDeferredComponentFromManifest("governance-workflow-submit-section", {
    loadingTestId: "governance-workflow-deferred-chunk-loading",
  });

/** Approvals list — below-fold relative to overview/header (wave 10 hub First Load). */
export const GovernanceWorkflowApprovalsListDeferred = createDeferredComponentFromManifest(
  "governance-workflow-approvals-list",
  { loadingTestId: "governance-workflow-deferred-chunk-loading" },
);

export const GovernanceWorkflowPromotionsActivationsSectionDeferred = createDeferredComponentFromManifest(
  "governance-workflow-promotions-activations",
  { loadingTestId: "governance-workflow-deferred-chunk-loading" },
);

export const GovernanceWorkflowDialogsDeferred = createDeferredComponentFromManifest(
  "governance-workflow-dialogs",
  { suppressLoading: true },
);

export const CtoDemoBuyerValueStripDeferred = createDeferredComponentFromManifest(
  "governance-workflow-cto-demo-buyer-value-strip",
  { suppressLoading: true },
);

export const CtoDemoSegregationCalloutDeferred = createDeferredComponentFromManifest(
  "governance-workflow-cto-demo-segregation-callout",
  { suppressLoading: true },
);

export const CtoDemoGovernancePreviewHintDeferred = createDeferredComponentFromManifest(
  "governance-workflow-cto-demo-governance-preview-hint",
  { suppressLoading: true },
);

export const GovernanceInteractiveQuickstartContentDeferred = createDeferredComponentFromManifest(
  "governance-workflow-interactive-quickstart",
  { loadingTestId: "governance-workflow-deferred-chunk-loading" },
);

/** Buyer approval narrative card — below-fold relative to workflow header (First Load split). */
export const GovernanceApprovalStoryCardDeferred = createDeferredComponentFromManifest(
  "governance-workflow-approval-story-card",
  { loadingTestId: "governance-workflow-deferred-chunk-loading" },
);

/** Environment releases accordion — advanced options, below primary approval path. */
export const AdvancedOptionsAccordionDeferred = createDeferredComponentFromManifest(
  "governance-workflow-advanced-options",
  { loadingTestId: "governance-workflow-deferred-chunk-loading" },
);

const governanceWorkflowPageContentLoadingWrapper = (): JSX.Element => (
  <div
    className="min-h-48 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
    role="status"
    aria-label="Loading approval workflow"
    data-testid="governance-workflow-chunk-loading"
  />
);

export const GovernanceWorkflowPageContentDeferred = createDeferredComponentFromManifest(
  "governance-workflow-page-content",
  { loadingWrapper: governanceWorkflowPageContentLoadingWrapper },
);
