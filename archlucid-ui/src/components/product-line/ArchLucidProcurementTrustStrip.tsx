import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  ARCHLUCID_PROCUREMENT_ASSURANCE_HREF,
  ARCHLUCID_PROCUREMENT_ASSURANCE_LABEL,
  ARCHLUCID_PROCUREMENT_EVIDENCE_MAP_HREF,
  ARCHLUCID_PROCUREMENT_EVIDENCE_MAP_LABEL,
  ARCHLUCID_PROCUREMENT_TRUST_CENTER_HREF,
  ARCHLUCID_PROCUREMENT_TRUST_CENTER_LABEL,
  ARCHLUCID_PROCUREMENT_TRUST_HEADING,
  ARCHLUCID_PROCUREMENT_TRUST_LEAD,
} from "@/lib/product-line/archlucid-procurement-trust-copy";

export function ArchLucidProcurementTrustStrip(): React.JSX.Element {
  return (
    <section
      aria-labelledby="archlucid-procurement-trust-heading"
      className="space-y-2 rounded border border-border bg-muted/20 p-3"
      data-testid="archlucid-procurement-trust-strip"
    >
      <h2 id="archlucid-procurement-trust-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
        {ARCHLUCID_PROCUREMENT_TRUST_HEADING}
      </h2>
      <p className={OPERATOR_TYPOGRAPHY.helper}>{ARCHLUCID_PROCUREMENT_TRUST_LEAD}</p>
      <p className={OPERATOR_TYPOGRAPHY.body}>
        <Link className={OPERATOR_LINK.inline} href={ARCHLUCID_PROCUREMENT_TRUST_CENTER_HREF}>
          {ARCHLUCID_PROCUREMENT_TRUST_CENTER_LABEL}
        </Link>
        {" · "}
        <Link className={OPERATOR_LINK.inline} href={ARCHLUCID_PROCUREMENT_ASSURANCE_HREF}>
          {ARCHLUCID_PROCUREMENT_ASSURANCE_LABEL}
        </Link>
        {" · "}
        <Link className={OPERATOR_LINK.inline} href={ARCHLUCID_PROCUREMENT_EVIDENCE_MAP_HREF}>
          {ARCHLUCID_PROCUREMENT_EVIDENCE_MAP_LABEL}
        </Link>
      </p>
    </section>
  );
}
