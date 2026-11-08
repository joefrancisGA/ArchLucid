import Link from "next/link";

import { SecureNowBetaSkuContentsSection } from "@/components/product-line/SecureNowBetaSkuContentsSection";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { MARKETING_LAYOUT, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_SKU_CARD_HEADING,
  SECURENOW_SKU_CARD_LEAD,
  SECURENOW_SKU_CARD_LIMIT,
  SECURENOW_SKU_CARD_ROWS,
} from "@/lib/marketing/securenow-sku-card-copy";
import { WHY_SECURENOW_STATUS_LINE } from "@/lib/marketing/why-securenow-draft-copy";
import { cn } from "@/lib/utils";

export function SecureNowSkuCardView(): React.JSX.Element {
  return (
    <MarketingPageShell variant="reading" data-testid="securenow-sku-card-page">
      <div className={cn(MARKETING_LAYOUT.sectionStack, "space-y-8")}>
        <p className={cn(MARKETING_TYPOGRAPHY.lead, "text-amber-900 dark:text-amber-200")}>
          {WHY_SECURENOW_STATUS_LINE}
        </p>
        <header className="space-y-3">
          <h1 className={MARKETING_TYPOGRAPHY.pageTitle}>{SECURENOW_SKU_CARD_HEADING}</h1>
          <p className={MARKETING_TYPOGRAPHY.lead}>{SECURENOW_SKU_CARD_LEAD}</p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">SecureNow SKU identifiers and meters</caption>
            <thead>
              <tr>
                <th className="border-b border-border p-2">SKU</th>
                <th className="border-b border-border p-2">Offer shape</th>
                <th className="border-b border-border p-2">Meter summary</th>
              </tr>
            </thead>
            <tbody>
              {SECURENOW_SKU_CARD_ROWS.map(([sku, shape, meter]) => (
                <tr key={sku}>
                  <td className="border-b border-border p-2 font-medium">{sku}</td>
                  <td className="border-b border-border p-2">{shape}</td>
                  <td className="border-b border-border p-2">{meter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SecureNowBetaSkuContentsSection />
        <p className={MARKETING_TYPOGRAPHY.body}>{SECURENOW_SKU_CARD_LIMIT}</p>
        <p className={MARKETING_TYPOGRAPHY.body}>
          <Link href="/why-securenow" className="text-al-link underline-offset-2 hover:underline">
            Why SecureNow
          </Link>
        </p>
      </div>
    </MarketingPageShell>
  );
}
