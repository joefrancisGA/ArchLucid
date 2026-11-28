import Link from "next/link";

import { SecureNowMarketabilityBuyerPathAuto } from "@/components/product-line/SecureNowMarketabilityBuyerPathAuto";
import { SecureNowAdminPartialCaptureStrip } from "@/components/product-line/SecureNowAdminPartialCaptureStrip";
import { SecureNowBetaSkuContentsSection } from "@/components/product-line/SecureNowBetaSkuContentsSection";
import { SecureNowFixtureWorkspaceNotEntitlementLine } from "@/components/product-line/SecureNowFixtureWorkspaceNotEntitlementLine";
import { SecureNowPublishedListPriceSection } from "@/components/product-line/SecureNowPublishedListPriceSection";
import { SecureNowQuotePacketMeterTableFootnote } from "@/components/product-line/SecureNowQuotePacketMeterTableFootnote";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { secureNowSkuMeterCapForSku } from "@/lib/marketing/securenow-public-commercial-packaging-copy";
import {
  PROCUREMENT_SN_EVAL_ANCHOR_FRAGMENT,
  PROCUREMENT_SN_EVAL_ANCHOR_TEST_ID,
} from "@/lib/procurement/procurement-evidence-map-anchors";
import {
  SECURENOW_QUOTE_PACKET_COMMERCE_LIMIT,
  SECURENOW_QUOTE_PACKET_GUARDRAIL,
  SECURENOW_QUOTE_PACKET_HEADING,
  SECURENOW_QUOTE_PACKET_LEAD,
  SECURENOW_QUOTE_PACKET_LINKS,
  SECURENOW_QUOTE_PACKET_SEQUENCE,
  SECURENOW_QUOTE_PACKET_SKUS,
  SECURENOW_QUOTE_PACKET_SN_EVAL_BODY,
  SECURENOW_QUOTE_PACKET_SN_EVAL_HEADING,
} from "@/lib/product-line/securenow-quote-packet-copy";
import { cn } from "@/lib/utils";

export function SecureNowQuotePacketPageView(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="full" data-testid="securenow-quote-packet-page">
      <OperatorPageHeader
        title={SECURENOW_QUOTE_PACKET_HEADING}
        subtitle={SECURENOW_QUOTE_PACKET_LEAD}
        claimDiscipline={SECURENOW_QUOTE_PACKET_GUARDRAIL}
        claimDisciplineTestId="securenow-quote-packet-claim-discipline"
        titleTestId="securenow-quote-packet-heading"
        subtitleTestId="securenow-quote-packet-lead"
      />

      <SecureNowMarketabilityBuyerPathAuto testId="securenow-quote-packet-marketability-buyer-path" />

      <main id="main-content" tabIndex={-1} className="mt-6 max-w-3xl space-y-6">
        <SecureNowAdminPartialCaptureStrip
          testId="securenow-quote-packet-partial-capture"
          cloudConnectionsTestId="securenow-quote-packet-partial-capture-cloud-connections"
          extractUploadTestId="securenow-quote-packet-partial-capture-extract-upload"
        />

        <section
          id={PROCUREMENT_SN_EVAL_ANCHOR_FRAGMENT}
          aria-labelledby="securenow-quote-packet-sn-eval-heading"
          className="space-y-2"
          data-testid={PROCUREMENT_SN_EVAL_ANCHOR_TEST_ID}
        >
          <h2 id="securenow-quote-packet-sn-eval-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            {SECURENOW_QUOTE_PACKET_SN_EVAL_HEADING}
          </h2>
          <p className={OPERATOR_TYPOGRAPHY.body}>{SECURENOW_QUOTE_PACKET_SN_EVAL_BODY}</p>
        </section>

        <section aria-labelledby="securenow-quote-packet-skus-heading" className="space-y-2">
          <h2 id="securenow-quote-packet-skus-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            SKU identifiers and meters
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            {SECURENOW_QUOTE_PACKET_SKUS.map(([sku, meter]) => {
              const meterCap = secureNowSkuMeterCapForSku(sku);

              return (
                <li key={sku} className={OPERATOR_TYPOGRAPHY.body} data-testid={`securenow-quote-packet-sku-${sku}`}>
                  <span className="font-medium">{sku}</span>
                  <span> — {meter}</span>
                  {meterCap !== null ? (
                    <span data-testid={`securenow-quote-packet-meter-cap-${sku}`}> — {meterCap}</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <SecureNowQuotePacketMeterTableFootnote />
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

        <SecureNowPublishedListPriceSection typography="operator" />

        <SecureNowBetaSkuContentsSection showQuoteLink={false} />
        <SecureNowFixtureWorkspaceNotEntitlementLine />

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

        <p className={OPERATOR_TYPOGRAPHY.body} data-testid="securenow-quote-packet-commerce-limit">
          {SECURENOW_QUOTE_PACKET_COMMERCE_LIMIT}
        </p>

        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-quote-packet-sources">
          <span className="font-medium text-al-text-primary">Sources:</span> Published list prices and SKU meters for
          quote preparation — quote-only; not countersigned order, tax identity, or in-product commerce authorization.
        </p>

        <p className={OPERATOR_TYPOGRAPHY.body}>
          <Link className={OPERATOR_LINK.inline} href="/administration">
            Administration hub
          </Link>
          {" · "}
          <Link className={OPERATOR_LINK.inline} href="/">
            Home
          </Link>
        </p>
      </main>
    </OperatorPageContainer>
  );
}