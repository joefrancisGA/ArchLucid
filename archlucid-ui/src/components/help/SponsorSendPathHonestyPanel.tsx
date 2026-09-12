import Link from "next/link";

import { PolicyPackInfluenceHonestyChip } from "@/components/reviews/PolicyPackInfluenceHonestyChip";
import {
  FIRST_REVIEW_GUIDE_DISPOSITION_BEFORE_SPONSOR_COPY,
  FIRST_REVIEW_GUIDE_POLICY_PACK_ASSIGNMENT_COPY,
  FIRST_REVIEW_GUIDE_SSO_OPTIONAL_COPY,
} from "@/lib/buyer/buyer-polish-copy";
import { CORE_PILOT_HELP_SPONSOR_HONESTY_TITLE } from "@/lib/core-pilot-help-guide-content";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE } from "@/lib/export-markdown-sendable-cover";
import { GOVERNANCE_FINDINGS_PATH, GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { cn } from "@/lib/utils";

export type SponsorSendPathHonestyPanelProps = {
  readonly className?: string;
  readonly showSsoOptional?: boolean;
  readonly testIdPrefix?: string;
  readonly title?: string;
};

/** Shared sponsor-send literacy: non-summing ROI, disposition, WK-21, optional SSO. */
export function SponsorSendPathHonestyPanel({
  className,
  showSsoOptional = true,
  testIdPrefix = "sponsor-send-path",
  title = CORE_PILOT_HELP_SPONSOR_HONESTY_TITLE,
}: SponsorSendPathHonestyPanelProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40",
        className,
      )}
      data-testid={`${testIdPrefix}-honesty-panel`}
    >
      <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{title}</h3>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid={`${testIdPrefix}-roi-non-summing`}>
        {SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE}
      </p>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid={`${testIdPrefix}-disposition-next-action`}>
        {FIRST_REVIEW_GUIDE_DISPOSITION_BEFORE_SPONSOR_COPY}{" "}
        <Link href={GOVERNANCE_FINDINGS_PATH} className={OPERATOR_LINK.inline}>
          Open findings queue
        </Link>
      </p>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid={`${testIdPrefix}-policy-pack-cta`}>
        {FIRST_REVIEW_GUIDE_POLICY_PACK_ASSIGNMENT_COPY}{" "}
        <Link href={GOVERNANCE_POLICY_PACKS_PATH} className={OPERATOR_LINK.inline}>
          Review policy pack assignments
        </Link>
      </p>
      <PolicyPackInfluenceHonestyChip />
      {showSsoOptional ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid={`${testIdPrefix}-sso-optional`}>
          {FIRST_REVIEW_GUIDE_SSO_OPTIONAL_COPY}{" "}
          <Link href="/administration/identity/sso-wizard" className={OPERATOR_LINK.inline}>
            Open SSO wizard
          </Link>
        </p>
      ) : null}
    </div>
  );
}
