import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_UPGRADE_CTA_HEADING,
  SECURENOW_UPGRADE_CTA_LEAD,
  SECURENOW_UPGRADE_CTA_QUOTE_HREF,
  SECURENOW_UPGRADE_CTA_QUOTE_LABEL,
  SECURENOW_UPGRADE_CTA_SKU_HREF,
  SECURENOW_UPGRADE_CTA_SKU_LABEL,
} from "@/lib/product-line/securenow-commercial-upgrade-cta-copy";

export function SecureNowCommercialUpgradeCtaStrip(): React.JSX.Element {
  return (
    <section
      className="space-y-2 rounded border border-border bg-muted/20 p-3"
      data-testid="securenow-commercial-upgrade-cta-strip"
    >
      <h2 className={OPERATOR_TYPOGRAPHY.cardTitle}>{SECURENOW_UPGRADE_CTA_HEADING}</h2>
      <p className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_UPGRADE_CTA_LEAD}</p>
      <p className={OPERATOR_TYPOGRAPHY.body}>
        <Link className={OPERATOR_LINK.inline} href={SECURENOW_UPGRADE_CTA_SKU_HREF}>
          {SECURENOW_UPGRADE_CTA_SKU_LABEL}
        </Link>
        {" · "}
        <Link className={OPERATOR_LINK.inline} href={SECURENOW_UPGRADE_CTA_QUOTE_HREF}>
          {SECURENOW_UPGRADE_CTA_QUOTE_LABEL}
        </Link>
      </p>
    </section>
  );
}
