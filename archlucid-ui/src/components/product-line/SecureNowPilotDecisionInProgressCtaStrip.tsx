import Link from "next/link";

import { SecureNowProcurementTrustFooterDrawer } from "@/components/product-line/SecureNowProcurementTrustFooterDrawer";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_PILOT_DECISION_IN_PROGRESS_LEAD,
  SECURENOW_PILOT_DECISION_IN_PROGRESS_PRIMARY_HREF,
  SECURENOW_PILOT_DECISION_IN_PROGRESS_PRIMARY_LABEL,
} from "@/lib/product-line/securenow-pilot-decision-in-progress-cta-copy";
import { cn } from "@/lib/utils";

export type SecureNowPilotDecisionInProgressCtaStripProps = {
  readonly visible: boolean;
};

export function SecureNowPilotDecisionInProgressCtaStrip(
  props: SecureNowPilotDecisionInProgressCtaStripProps,
): React.JSX.Element | null {
  if (!props.visible) {
    return null;
  }

  return (
    <section
      className="space-y-2 rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800"
      data-testid="securenow-pilot-decision-in-progress-cta"
      aria-label="Pilot decision procurement next steps"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{SECURENOW_PILOT_DECISION_IN_PROGRESS_LEAD}</p>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
        <Link
          className={OPERATOR_LINK.inline}
          href={SECURENOW_PILOT_DECISION_IN_PROGRESS_PRIMARY_HREF}
          data-testid="securenow-pilot-decision-in-progress-quote-primary"
        >
          {SECURENOW_PILOT_DECISION_IN_PROGRESS_PRIMARY_LABEL}
        </Link>
      </p>
      <SecureNowProcurementTrustFooterDrawer />
    </section>
  );
}
