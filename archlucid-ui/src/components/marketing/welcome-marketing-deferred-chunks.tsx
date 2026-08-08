"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { MARKETING_LAYOUT } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import type { MarketingTierPricingSectionProps } from "./MarketingTierPricingSection";

function WelcomeMarketingDeferredSectionLoading(props: { readonly label: string }): React.JSX.Element {
  return (
    <div
      className={cn(
        "min-h-32 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800",
        MARKETING_LAYOUT.sectionStack,
      )}
      role="status"
      aria-label={props.label}
      data-testid="welcome-marketing-deferred-chunk-loading"
    />
  );
}

export const MarketingTierPricingSectionDeferred: ComponentType<MarketingTierPricingSectionProps> =
  dynamic(
    () =>
      import("./MarketingTierPricingSection").then((module) => module.MarketingTierPricingSection),
    {
      loading: () => <WelcomeMarketingDeferredSectionLoading label="Loading packaging overview" />,
    },
  );
