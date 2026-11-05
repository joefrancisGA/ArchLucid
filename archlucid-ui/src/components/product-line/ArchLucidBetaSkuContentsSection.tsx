import Link from "next/link";

import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  ARCHLUCID_BETA_SKU_CONTENTS_EXCLUDES,
  ARCHLUCID_BETA_SKU_CONTENTS_HEADING,
  ARCHLUCID_BETA_SKU_CONTENTS_INCLUDES,
  ARCHLUCID_BETA_SKU_CONTENTS_LEAD,
  ARCHLUCID_BETA_SKU_CONTENTS_QUOTE_HREF,
  ARCHLUCID_BETA_SKU_CONTENTS_QUOTE_LABEL,
} from "@/lib/product-line/archlucid-beta-sku-contents-copy";

type ArchLucidBetaSkuContentsSectionProps = {
  readonly showQuoteLink?: boolean;
};

export function ArchLucidBetaSkuContentsSection(
  props: ArchLucidBetaSkuContentsSectionProps,
): React.JSX.Element {
  const showQuoteLink = props.showQuoteLink ?? true;

  return (
    <section
      aria-labelledby="archlucid-beta-sku-contents-heading"
      className="mb-8 space-y-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="archlucid-beta-sku-contents-section"
    >
      <h2 id="archlucid-beta-sku-contents-heading" className={MARKETING_TYPOGRAPHY.sectionTitle}>
        {ARCHLUCID_BETA_SKU_CONTENTS_HEADING}
      </h2>
      <p className={MARKETING_TYPOGRAPHY.body}>{ARCHLUCID_BETA_SKU_CONTENTS_LEAD}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className={MARKETING_TYPOGRAPHY.meta}>Includes</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {ARCHLUCID_BETA_SKU_CONTENTS_INCLUDES.map((item) => (
              <li key={item} className={MARKETING_TYPOGRAPHY.body}>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className={MARKETING_TYPOGRAPHY.meta}>Does not include</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {ARCHLUCID_BETA_SKU_CONTENTS_EXCLUDES.map((item) => (
              <li key={item} className={MARKETING_TYPOGRAPHY.body}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {showQuoteLink ? (
        <p className={MARKETING_TYPOGRAPHY.body}>
          <Link className={MARKETING_SURFACES.inlineLink} href={ARCHLUCID_BETA_SKU_CONTENTS_QUOTE_HREF}>
            {ARCHLUCID_BETA_SKU_CONTENTS_QUOTE_LABEL}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
