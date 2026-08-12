"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { DeferredChunkLoading } from "@/components/ui/deferred-chunk-loading";
import { MARKETING_LAYOUT } from "@/lib/design-tokens";

import type { MarketingTierPricingSectionProps } from "./MarketingTierPricingSection";

function welcomeMarketingDeferredSectionLoading(label: string): React.JSX.Element {
  return (
    <DeferredChunkLoading
      label={label}
      variant="marketing"
      className={MARKETING_LAYOUT.sectionStack}
      testId="welcome-marketing-deferred-chunk-loading"
    />
  );
}

export const MarketingTierPricingSectionDeferred: ComponentType<MarketingTierPricingSectionProps> =
  dynamic(
    () =>
      import("./MarketingTierPricingSection").then((module) => module.MarketingTierPricingSection),
    {
      loading: () => welcomeMarketingDeferredSectionLoading("Loading packaging overview"),
    },
  );
