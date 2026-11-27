import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_BILLING_COMPARISON_ARCHLUCID_COLUMN,
  SECURENOW_BILLING_COMPARISON_ARCHLUCID_ROWS,
  SECURENOW_BILLING_COMPARISON_HEADING,
  SECURENOW_BILLING_COMPARISON_LEAD,
  SECURENOW_BILLING_COMPARISON_QUOTE_PACKET_HREF,
  SECURENOW_BILLING_COMPARISON_SECURENOW_COLUMN,
  SECURENOW_BILLING_COMPARISON_SECURENOW_EXCLUDES,
  SECURENOW_BILLING_COMPARISON_SECURENOW_INCLUDES,
  SECURENOW_BILLING_COMPARISON_SKU_CARD_HREF,
} from "@/lib/product-line/securenow-billing-plan-comparison-copy";
import { cn } from "@/lib/utils";

export function SecureNowArchLucidBillingComparisonStrip(): React.JSX.Element {
  return (
    <section
      className="space-y-3 rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid="securenow-archlucid-billing-comparison-strip"
      aria-labelledby="securenow-billing-comparison-heading"
    >
      <h2 id="securenow-billing-comparison-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {SECURENOW_BILLING_COMPARISON_HEADING}
      </h2>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{SECURENOW_BILLING_COMPARISON_LEAD}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}>{SECURENOW_BILLING_COMPARISON_ARCHLUCID_COLUMN}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {SECURENOW_BILLING_COMPARISON_ARCHLUCID_ROWS.map((row) => (
              <li key={row} className={OPERATOR_TYPOGRAPHY.body}>
                {row}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}>{SECURENOW_BILLING_COMPARISON_SECURENOW_COLUMN}</p>
          <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>Includes</p>
          <ul className="list-disc space-y-1 pl-5">
            {SECURENOW_BILLING_COMPARISON_SECURENOW_INCLUDES.map((row) => (
              <li key={row} className={OPERATOR_TYPOGRAPHY.body}>
                {row}
              </li>
            ))}
          </ul>
          <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>Not included</p>
          <ul className="list-disc space-y-1 pl-5">
            {SECURENOW_BILLING_COMPARISON_SECURENOW_EXCLUDES.map((row) => (
              <li key={row} className={OPERATOR_TYPOGRAPHY.body}>
                {row}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
        <Link
          className={OPERATOR_LINK.inline}
          href={SECURENOW_BILLING_COMPARISON_SKU_CARD_HREF}
          data-testid="securenow-billing-comparison-sku-card-link"
        >
          Public SecureNow SKU card
        </Link>
        {" · "}
        <Link
          className={OPERATOR_LINK.inline}
          href={SECURENOW_BILLING_COMPARISON_QUOTE_PACKET_HREF}
          data-testid="securenow-billing-comparison-quote-packet-link"
        >
          Signed-in quote packet
        </Link>
      </p>
    </section>
  );
}
