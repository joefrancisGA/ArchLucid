import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_PROCUREMENT_ASSURANCE_HREF,
  SECURENOW_PROCUREMENT_ASSURANCE_LABEL,
  SECURENOW_PROCUREMENT_TRUST_CENTER_HREF,
  SECURENOW_PROCUREMENT_TRUST_CENTER_LABEL,
  SECURENOW_PROCUREMENT_TRUST_HEADING,
  SECURENOW_PROCUREMENT_TRUST_LEAD,
} from "@/lib/product-line/securenow-procurement-trust-copy";

export function SecureNowProcurementTrustStrip(): React.JSX.Element {
  return (
    <section
      aria-labelledby="securenow-procurement-trust-heading"
      className="space-y-2 rounded border border-border bg-muted/20 p-3"
      data-testid="securenow-procurement-trust-strip"
    >
      <h2 id="securenow-procurement-trust-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
        {SECURENOW_PROCUREMENT_TRUST_HEADING}
      </h2>
      <p className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_PROCUREMENT_TRUST_LEAD}</p>
      <p className={OPERATOR_TYPOGRAPHY.body}>
        <Link className={OPERATOR_LINK.inline} href={SECURENOW_PROCUREMENT_TRUST_CENTER_HREF}>
          {SECURENOW_PROCUREMENT_TRUST_CENTER_LABEL}
        </Link>
        {" · "}
        <Link className={OPERATOR_LINK.inline} href={SECURENOW_PROCUREMENT_ASSURANCE_HREF}>
          {SECURENOW_PROCUREMENT_ASSURANCE_LABEL}
        </Link>
      </p>
    </section>
  );
}
