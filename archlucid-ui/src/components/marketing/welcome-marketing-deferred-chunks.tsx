"use client";

import type { ComponentType } from "react";

import { MARKETING_LAYOUT } from "@/lib/design-tokens";
import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

import type { MarketingTierPricingSectionProps } from "./MarketingTierPricingSection";

export const MarketingTierPricingSectionDeferred: ComponentType<MarketingTierPricingSectionProps> =
  createDeferredComponentFromManifest("marketing-welcome-tier-pricing-section", {
    loadingTestId: "welcome-marketing-deferred-chunk-loading",
    loadingClassName: MARKETING_LAYOUT.sectionStack,
  });
