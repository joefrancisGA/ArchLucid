import { cn } from "@/lib/utils";

import { CopyIdButton } from "@/components/CopyIdButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  formatReportProblemAcknowledgement,
  REPORT_PROBLEM_FIELD_LABEL_REFERENCE_ID,
} from "@/lib/report-problem-copy";

export function ReportProblemAcknowledgementPanel(props: {
  readonly referenceId: string;
  readonly supportBundleAttachWarning: string | null;
}): React.JSX.Element {
  const { referenceId, supportBundleAttachWarning } = props;
  const acknowledgement = formatReportProblemAcknowledgement(referenceId);

  return (
    <div className="space-y-4" data-testid="report-problem-ack-panel">
      <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{acknowledgement}</p>
      {supportBundleAttachWarning !== null ? (
        <p
          className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="report-problem-bundle-attach-warning"
          role="status"
        >
          {supportBundleAttachWarning}
        </p>
      ) : null}
      <div className="flex items-center gap-2">
        <span className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {REPORT_PROBLEM_FIELD_LABEL_REFERENCE_ID}
        </span>
        <code className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{referenceId}</code>
        <CopyIdButton value={referenceId} aria-label="Copy report reference ID" />
      </div>
    </div>
  );
}
