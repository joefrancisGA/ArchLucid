import Link from "next/link";

import { ProcurementEvidenceMapSection } from "@/components/procurement/ProcurementEvidenceMapSection";
import { SecureNowBetaSkuContentsSection } from "@/components/product-line/SecureNowBetaSkuContentsSection";
import { SECURENOW_PROCUREMENT_EVIDENCE_ROWS } from "@/lib/procurement/procurement-evidence-map-copy";
import { SecureNowPublicQuoteSequenceSection } from "@/components/product-line/SecureNowPublicQuoteSequenceSection";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { MARKETING_LAYOUT, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_ARCHITECTURE_SUBSCRIPTION_BOUNDARY,
  SECURENOW_SKU_CARD_HEADING,
  SECURENOW_SKU_CARD_LEAD,
  SECURENOW_SKU_CARD_LIMIT,
  SECURENOW_SKU_CARD_ROWS,
} from "@/lib/marketing/securenow-sku-card-copy";
import {
  SECURENOW_SKU_METER_CAP_COLUMN,
  secureNowSkuMeterCapForSku,
} from "@/lib/marketing/securenow-public-commercial-packaging-copy";
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
                <th className="border-b border-border p-2">{SECURENOW_SKU_METER_CAP_COLUMN}</th>
              </tr>
            </thead>
            <tbody>
              {SECURENOW_SKU_CARD_ROWS.map(([sku, shape, meter]) => (
                <tr key={sku}>
                  <td className="border-b border-border p-2 font-medium">{sku}</td>
                  <td className="border-b border-border p-2">{shape}</td>
                  <td className="border-b border-border p-2">{meter}</td>
                  <td className="border-b border-border p-2">
                    {secureNowSkuMeterCapForSku(sku) ?? "Meter cap copy was not stored."}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={MARKETING_TYPOGRAPHY.body} data-testid="securenow-sku-architecture-boundary">
          {SECURENOW_ARCHITECTURE_SUBSCRIPTION_BOUNDARY}
        </p>
        <SecureNowBetaSkuContentsSection />
        <ProcurementEvidenceMapSection
          rows={SECURENOW_PROCUREMENT_EVIDENCE_ROWS}
          testId="securenow-sku-procurement-evidence-map"
        />
        <SecureNowPublicQuoteSequenceSection />
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
