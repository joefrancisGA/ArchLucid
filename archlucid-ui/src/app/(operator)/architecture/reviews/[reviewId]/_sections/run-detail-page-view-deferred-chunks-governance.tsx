"use client";

import type { ComponentType } from "react";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

import { RunDetailExplanationSkeleton } from "./RunDetailDeferredSkeleton";
import type { RunDetailAuthorityChainSection } from "./RunDetailAuthorityChainSection";

export const RunDetailGovernanceAlertsDeferred = createDeferredComponentFromManifest(
  "run-detail-governance-alerts",
  { suppressLoading: true },
);

export const RunDetailCommitBlockingFindingsBannerDeferred = createDeferredComponentFromManifest(
  "run-detail-commit-blocking-findings-banner",
  { suppressLoading: true },
);

export const RunDetailPolicyPackImpactCalloutDeferred = createDeferredComponentFromManifest(
  "run-detail-policy-pack-impact-callout",
  { suppressLoading: true },
);

export const RunDetailCtoDemoReviewRouteGuardDeferred = createDeferredComponentFromManifest(
  "run-detail-cto-demo-review-route-guard",
  { suppressLoading: true },
);

export const RunDetailGovernanceDecisionSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-governance-decision-section",
  {
    loadingWrapper: (_loading) => <RunDetailExplanationSkeleton />,
  },
);

export const RunDetailGovernanceCtaDeferred = createDeferredComponentFromManifest(
  "run-detail-governance-cta",
  { suppressLoading: true },
);

export const RunDetailAuthorityChainSectionDeferred: ComponentType<
  React.ComponentProps<typeof RunDetailAuthorityChainSection>
> = createDeferredComponentFromManifest("run-detail-authority-chain-section", { suppressLoading: true });

export const RunDetailBuyerPilotConversionSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-buyer-pilot-conversion-section",
  { suppressLoading: true },
);

export const RunDetailBuyerModeFallbackBannerDeferred = createDeferredComponentFromManifest(
  "run-detail-buyer-mode-fallback-banner",
  { suppressLoading: true },
);

/** TB-2142 — demo marketing chrome off sync First Load JS. */
export const RunDetailDemoMarketingChromeDeferred = createDeferredComponentFromManifest(
  "run-detail-demo-marketing-chrome",
  { suppressLoading: true },
);
