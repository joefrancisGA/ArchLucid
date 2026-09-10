import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { LayerHeader } from "@/components/LayerHeader";
import { BUYER_RISK_EXCEPTIONS_PAGE_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { GOVERNANCE_EXCEPTIONS_PATH } from "@/lib/governance/governance-route-paths";
import {
  GOVERNANCE_RISK_EXCEPTIONS_PRIMARY_CONTENT_ID,
  GOVERNANCE_RISK_EXCEPTIONS_SKIP_LINK_LABEL,
} from "@/lib/governance-risk-exceptions-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { RISK_EXCEPTIONS_CLAIM_DISCIPLINE } from "@/lib/risk-exceptions-evidence-copy";

import { RiskExceptionsBreadcrumb } from "./_sections/RiskExceptionsBreadcrumb";
import { RiskExceptionsLoadingSkeleton } from "./_sections/RiskExceptionsLoadingSkeleton";
import { RISK_EXCEPTIONS_PAGE_SUBTITLE_BUYER } from "./risk-exceptions-page-copy";

export default function RiskExceptionsLoading(): React.JSX.Element {
  return (
    <div className="space-y-4 p-4" data-testid="risk-exceptions-route-loading">
      <a
        href={`#${GOVERNANCE_RISK_EXCEPTIONS_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {GOVERNANCE_RISK_EXCEPTIONS_SKIP_LINK_LABEL}
      </a>
      <LayerHeader pageKey="exceptions" density="compact" />
      <OperatorPageHeader
        navHref={GOVERNANCE_EXCEPTIONS_PATH}
        title={BUYER_RISK_EXCEPTIONS_PAGE_TITLE}
        subtitle={RISK_EXCEPTIONS_PAGE_SUBTITLE_BUYER}
        claimDiscipline={RISK_EXCEPTIONS_CLAIM_DISCIPLINE}
        claimDisciplineTestId="risk-exceptions-claim-discipline"
        breadcrumb={<RiskExceptionsBreadcrumb />}
      />
      <RiskExceptionsLoadingSkeleton />
    </div>
  );
}
