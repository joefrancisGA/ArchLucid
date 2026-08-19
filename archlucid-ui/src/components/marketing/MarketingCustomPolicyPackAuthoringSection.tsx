import { cn } from "@/lib/utils";
import { MARKETING_SURFACES, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  buildCustomPolicyPackQuoteHref,
  CUSTOM_POLICY_PACK_AUTHORING_SKUS,
  CUSTOM_POLICY_PACK_SOW_HREF,
} from "@/lib/marketing-custom-policy-pack-authoring";

export type MarketingCustomPolicyPackAuthoringSectionProps = {
  quoteSectionDomId?: string;
};

/** Public GTM surface for productized custom policy pack authoring PS SKUs (Improvement #7). */
export function MarketingCustomPolicyPackAuthoringSection(
  props: MarketingCustomPolicyPackAuthoringSectionProps,
) {
  const quoteSectionDomId = props.quoteSectionDomId ?? "pricing-quote-request";
  const quoteHref = buildCustomPolicyPackQuoteHref(quoteSectionDomId);

  return (
    <section
      id="custom-policy-pack-authoring"
      aria-labelledby="custom-policy-pack-authoring-heading"
      data-testid="custom-policy-pack-authoring-section"
      className="mb-10 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/60"
    >
      <h2
        id="custom-policy-pack-authoring-heading"
        className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.pageTitle)}
      >
        Optional professional services
      </h2>
      <p className={cn("mt-3 max-w-3xl leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        Need customer-specific governance policy packs beyond bundled defaults? ArchLucid offers fixed-scope professional
        services engagements — choose an IP tier that matches your confidentiality posture:
      </p>
      <ul className={cn("mt-3 list-disc space-y-1 pl-5 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        <li>
          <strong>Customer-exclusive</strong> — pack content stays confidential to your organization; ArchLucid does not
          resell the pack verbatim.
        </li>
        <li>
          <strong>ArchLucid-owned (shared)</strong> — unlimited internal use for you; ArchLucid may reuse generalized
          patterns (not verbatim competitor-targeted packs) in other engagements and, at our discretion, in{" "}
          <strong>PlatformDefault</strong> bundles.
        </li>
      </ul>

      <div className="mt-6 overflow-x-auto">
        <table className={cn("min-w-full border-collapse text-left", OPERATOR_TYPOGRAPHY.body)}>
          <caption className="sr-only">Custom policy pack authoring SKU scope matrix</caption>
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-700">
              <th scope="col" className="py-2 pr-4 font-semibold text-neutral-900 dark:text-neutral-100">
                SKU
              </th>
              <th scope="col" className="py-2 pr-4 font-semibold text-neutral-900 dark:text-neutral-100">
                Scope
              </th>
              <th scope="col" className="py-2 pr-4 font-semibold text-neutral-900 dark:text-neutral-100">
                Delivery window
              </th>
              <th scope="col" className="py-2 font-semibold text-neutral-900 dark:text-neutral-100">
                Post-delivery support
              </th>
            </tr>
          </thead>
          <tbody>
            {CUSTOM_POLICY_PACK_AUTHORING_SKUS.map((sku) => (
              <tr
                key={sku.id}
                className="border-b border-neutral-100 dark:border-neutral-800"
                data-testid={`custom-policy-pack-sku-${sku.id}`}
              >
                <th scope="row" className="py-3 pr-4 font-medium text-neutral-900 dark:text-neutral-100">
                  {sku.title}
                </th>
                <td className="py-3 pr-4 text-neutral-700 dark:text-neutral-300">{sku.scopeSummary}</td>
                <td className="py-3 pr-4 text-neutral-700 dark:text-neutral-300">{sku.deliveryWindow}</td>
                <td className="py-3 text-neutral-700 dark:text-neutral-300">{sku.postDeliverySupport}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={cn("mt-4 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        Delivery windows, maintenance options, and scope details are finalized in your statement of work.{" "}
        <a
          className={MARKETING_SURFACES.inlineLink}
          href={CUSTOM_POLICY_PACK_SOW_HREF}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="custom-policy-pack-sow-link"
        >
          Review the SoW template
        </a>{" "}
        before procurement.
      </p>

      <div className="mt-5">
        <Button asChild variant="primary">
          <Link href={quoteHref} data-testid="custom-policy-pack-quote-cta">
            Request custom pack quote
          </Link>
        </Button>
      </div>
    </section>
  );
}
