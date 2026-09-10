import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { GOVERNANCE_RECURRENCE_SCHEDULES_PATH } from "@/lib/governance/recurrence-schedules-route";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { RECURRENCE_SCHEDULES_CLAIM_DISCIPLINE } from "@/lib/recurrence-schedules-evidence-copy";
import { recurrenceSchedulesPageSubtitle } from "@/lib/recurrence-schedules-copy";
import {
  RECURRENCE_SCHEDULES_PRIMARY_CONTENT_ID,
  RECURRENCE_SCHEDULES_SKIP_LINK_LABEL,
} from "@/lib/recurrence-schedules-page-copy";

import { RecurrenceSchedulesLoadingSkeleton } from "@/components/governance/RecurrenceSchedulesLoadingSkeleton";

export default function RecurrenceSchedulesLoading(): React.JSX.Element {
  return (
    <div className="space-y-4 p-4" data-testid="recurrence-schedules-route-loading">
      <a
        href={`#${RECURRENCE_SCHEDULES_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {RECURRENCE_SCHEDULES_SKIP_LINK_LABEL}
      </a>
      <LayerHeader pageKey="recurrence-schedules" density="compact" />
      <OperatorPageHeader
        navHref={GOVERNANCE_RECURRENCE_SCHEDULES_PATH}
        title="Recurrence schedules"
        subtitle={recurrenceSchedulesPageSubtitle(true)}
        claimDiscipline={RECURRENCE_SCHEDULES_CLAIM_DISCIPLINE}
        claimDisciplineTestId="recurrence-schedules-claim-discipline"
      />
      <RecurrenceSchedulesLoadingSkeleton />
    </div>
  );
}
