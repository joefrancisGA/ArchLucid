import Link from "next/link";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_REVIEWER_PACKET_COMMERCE_LIMIT,
  SECURENOW_REVIEWER_PACKET_GUARDRAIL,
  SECURENOW_REVIEWER_PACKET_HEADING,
  SECURENOW_REVIEWER_PACKET_LEAD,
  SECURENOW_REVIEWER_PACKET_NO_GO,
  SECURENOW_REVIEWER_PACKET_OPERATOR_LINKS,
  SECURENOW_REVIEWER_PACKET_PROCUREMENT_ITEMS,
  SECURENOW_REVIEWER_PACKET_QUOTE_GUARDRAIL,
  SECURENOW_REVIEWER_PACKET_SEQUENCE,
  SECURENOW_REVIEWER_PACKET_SKUS,
  SECURENOW_REVIEWER_PACKET_SOURCE_NOTES,
} from "@/lib/product-line/securenow-reviewer-packet-copy";

export function SecureNowReviewerPacketPageView(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="full" data-testid="securenow-reviewer-packet-page">
      <OperatorPageHeader title={SECURENOW_REVIEWER_PACKET_HEADING} subtitle={SECURENOW_REVIEWER_PACKET_LEAD} />

      <main className="mt-6 max-w-3xl space-y-6">
        <p className={OPERATOR_TYPOGRAPHY.body}>{SECURENOW_REVIEWER_PACKET_NO_GO}</p>

        <section aria-labelledby="securenow-reviewer-packet-procurement-heading" className="space-y-2">
          <h2 id="securenow-reviewer-packet-procurement-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Procurement packet contents
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            {SECURENOW_REVIEWER_PACKET_PROCUREMENT_ITEMS.map((item) => (
              <li key={item} className={OPERATOR_TYPOGRAPHY.body}>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="securenow-reviewer-packet-skus-heading" className="space-y-2">
          <h2 id="securenow-reviewer-packet-skus-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            SKU identifiers and meters
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            {SECURENOW_REVIEWER_PACKET_SKUS.map(([sku, meter]) => (
              <li key={sku} className={OPERATOR_TYPOGRAPHY.body}>
                <span className="font-medium">{sku}</span>
                <span> — {meter}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="securenow-reviewer-packet-sequence-heading" className="space-y-2">
          <h2 id="securenow-reviewer-packet-sequence-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Quote sequence
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            {SECURENOW_REVIEWER_PACKET_SEQUENCE.map((step) => (
              <li key={step} className={OPERATOR_TYPOGRAPHY.body}>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="securenow-reviewer-packet-operator-heading" className="space-y-2">
          <h2 id="securenow-reviewer-packet-operator-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            In-product readiness
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            {SECURENOW_REVIEWER_PACKET_OPERATOR_LINKS.map((link) => (
              <li key={link.href} className={OPERATOR_TYPOGRAPHY.body}>
                <Link className={OPERATOR_LINK.inline} href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="securenow-reviewer-packet-sources-heading" className="space-y-2">
          <h2 id="securenow-reviewer-packet-sources-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Source notes
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            {SECURENOW_REVIEWER_PACKET_SOURCE_NOTES.map((link) => (
              <li key={link.label} className={OPERATOR_TYPOGRAPHY.body}>
                <Link className={OPERATOR_LINK.inline} href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <p className={OPERATOR_TYPOGRAPHY.body}>{SECURENOW_REVIEWER_PACKET_GUARDRAIL}</p>
        <p className={OPERATOR_TYPOGRAPHY.body}>{SECURENOW_REVIEWER_PACKET_QUOTE_GUARDRAIL}</p>
        <p className={OPERATOR_TYPOGRAPHY.body}>{SECURENOW_REVIEWER_PACKET_COMMERCE_LIMIT}</p>
        <p className={OPERATOR_TYPOGRAPHY.body}>
          <Link className={OPERATOR_LINK.inline} href="/why-securenow">
            Public Why SecureNow page
          </Link>
          {" · "}
          <Link className={OPERATOR_LINK.inline} href="/">
            Back to Home
          </Link>
        </p>
      </main>
    </OperatorPageContainer>
  );
}
