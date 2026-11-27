"use client";

import { useSearchParams } from "next/navigation";

import { SecureNowBetaSkuContentsSection } from "@/components/product-line/SecureNowBetaSkuContentsSection";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_FIRST_HOUR_MARKETING_FROM_PARAM,
  SECURENOW_FIRST_HOUR_MARKETING_SKU_BAND_LEAD,
} from "@/lib/product-line/securenow-first-hour-marketing-entry-copy";
import { cn } from "@/lib/utils";

export function SecureNowFirstHourMarketingSkuBand(): React.JSX.Element | null {
  const searchParams = useSearchParams();
  const from = searchParams.get("from")?.trim() ?? "";

  if (from !== SECURENOW_FIRST_HOUR_MARKETING_FROM_PARAM) {
    return null;
  }

  return (
    <section
      className="space-y-3"
      data-testid="securenow-first-hour-marketing-sku-band"
      aria-label="Beta SKU contents from marketing entry"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{SECURENOW_FIRST_HOUR_MARKETING_SKU_BAND_LEAD}</p>
      <SecureNowBetaSkuContentsSection />
    </section>
  );
}
