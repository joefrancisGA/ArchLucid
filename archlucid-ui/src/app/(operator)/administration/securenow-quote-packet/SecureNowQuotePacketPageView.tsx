import Link from "next/link";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_QUOTE_PACKET_COMMERCE_LIMIT,
  SECURENOW_QUOTE_PACKET_GUARDRAIL,
  SECURENOW_QUOTE_PACKET_HEADING,
  SECURENOW_QUOTE_PACKET_LEAD,
  SECURENOW_QUOTE_PACKET_LINKS,
  SECURENOW_QUOTE_PACKET_SEQUENCE,
  SECURENOW_QUOTE_PACKET_SKUS,
} from "@/lib/product-line/securenow-quote-packet-copy";

export function SecureNowQuotePacketPageView(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="full" data-testid="securenow-quote-packet-page">
      <OperatorPageHeader title={SECURENOW_QUOTE_PACKET_HEADING} subtitle={SECURENOW_QUOTE_PACKET_LEAD} />

      <main className="mt-6 max-w-3xl space-y-6">
        <section aria-labelledby="securenow-quote-packet-skus-heading" className="space-y-2">
          <h2 id="securenow-quote-packet-skus-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            SKU identifiers and meters
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            {SECURENOW_QUOTE_PACKET_SKUS.map(([sku, meter]) => (
              <li key={sku} className={OPERATOR_TYPOGRAPHY.body}>
                <span className="font-medium">{sku}</span>
                <span> — {meter}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="securenow-quote-packet-sequence-heading" className="space-y-2">
          <h2 id="securenow-quote-packet-sequence-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Quote sequence
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            {SECURENOW_QUOTE_PACKET_SEQUENCE.map((step) => (
              <li key={step} className={OPERATOR_TYPOGRAPHY.body}>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="securenow-quote-packet-links-heading" className="space-y-2">
          <h2 id="securenow-quote-packet-links-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Source notes
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            {SECURENOW_QUOTE_PACKET_LINKS.map((link) => (
              <li key={link.href} className={OPERATOR_TYPOGRAPHY.body}>
                <Link className={OPERATOR_LINK.inline} href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <p className={OPERATOR_TYPOGRAPHY.body}>{SECURENOW_QUOTE_PACKET_GUARDRAIL}</p>
        <p className={OPERATOR_TYPOGRAPHY.body}>{SECURENOW_QUOTE_PACKET_COMMERCE_LIMIT}</p>
      </main>
    </OperatorPageContainer>
  );
}
