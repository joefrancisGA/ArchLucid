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

export function SecureNowProcurementTrustFooterDrawer(): React.JSX.Element {
  return (
    <details className="ml-auto text-right" data-testid="securenow-procurement-trust-footer-drawer">
      <summary className={`${OPERATOR_TYPOGRAPHY.helper} cursor-pointer font-medium text-al-accent-interactive`}>
        {SECURENOW_PROCUREMENT_TRUST_HEADING}
      </summary>
      <div className="mt-2 space-y-1 text-left">
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
      </div>
    </details>
  );
}
