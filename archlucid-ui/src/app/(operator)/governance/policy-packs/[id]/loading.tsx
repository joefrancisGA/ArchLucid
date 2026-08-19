import Link from "next/link";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { OPERATOR_LINK } from "@/lib/design-tokens";

/** Short-lived navigation shell for policy pack detail — structured chrome (not a bare loading line). */
export default function PolicyPackDetailLoading() {
  return (
    <div
      className="w-full max-w-[1200px] space-y-4 p-4"
      data-testid="policy-pack-detail-loading-shell"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <OperatorPageHeader
        title="Policy pack detail"
        headingLevel="h1"
        subtitle="Loading policy pack…"
        breadcrumb={
          <Link className={OPERATOR_LINK.nav} href={GOVERNANCE_POLICY_PACKS_PATH}>
            Policy packs
          </Link>
        }
      />
    </div>
  );
}
