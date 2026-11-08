import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_BETA_SKU_CONTENTS_EXCLUDES,
  SECURENOW_BETA_SKU_CONTENTS_HEADING,
  SECURENOW_BETA_SKU_CONTENTS_INCLUDES,
  SECURENOW_BETA_SKU_CONTENTS_LEAD,
  SECURENOW_BETA_SKU_CONTENTS_QUOTE_HREF,
  SECURENOW_BETA_SKU_CONTENTS_QUOTE_LABEL,
} from "@/lib/product-line/securenow-beta-sku-contents-copy";

type SecureNowBetaSkuContentsSectionProps = {
  readonly showQuoteLink?: boolean;
};

export function SecureNowBetaSkuContentsSection(
  props: SecureNowBetaSkuContentsSectionProps,
): React.JSX.Element {
  const showQuoteLink = props.showQuoteLink ?? true;

  return (
    <section
      aria-labelledby="securenow-beta-sku-contents-heading"
      className="space-y-3"
      data-testid="securenow-beta-sku-contents-section"
    >
      <h2 id="securenow-beta-sku-contents-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
        {SECURENOW_BETA_SKU_CONTENTS_HEADING}
      </h2>
      <p className={OPERATOR_TYPOGRAPHY.body}>{SECURENOW_BETA_SKU_CONTENTS_LEAD}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className={OPERATOR_TYPOGRAPHY.helper}>Includes</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {SECURENOW_BETA_SKU_CONTENTS_INCLUDES.map((item) => (
              <li key={item} className={OPERATOR_TYPOGRAPHY.body}>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className={OPERATOR_TYPOGRAPHY.helper}>Does not include</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {SECURENOW_BETA_SKU_CONTENTS_EXCLUDES.map((item) => (
              <li key={item} className={OPERATOR_TYPOGRAPHY.body}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {showQuoteLink ? (
        <p className={OPERATOR_TYPOGRAPHY.body}>
          <Link className={OPERATOR_LINK.inline} href={SECURENOW_BETA_SKU_CONTENTS_QUOTE_HREF}>
            {SECURENOW_BETA_SKU_CONTENTS_QUOTE_LABEL}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
