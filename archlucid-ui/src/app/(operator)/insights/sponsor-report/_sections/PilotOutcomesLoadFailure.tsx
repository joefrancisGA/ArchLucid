import { Button } from "@/components/ui/button";
import { FatalPageReportProblemSupportRow } from "@/components/support/FatalPageReportProblemAction";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { PILOT_OUTCOMES_LOAD_RETRY_LABEL } from "@/lib/pilot-outcomes-page-copy";
import { cn } from "@/lib/utils";

export type PilotOutcomesLoadFailureProps = {
  readonly message: string;
  readonly onRetry: () => void;
  readonly correlationId?: string | null;
};

/** Sponsor report load failure with retry (SPP). */
export function PilotOutcomesLoadFailure(props: PilotOutcomesLoadFailureProps): React.JSX.Element {
  const correlationId = props.correlationId?.trim() ?? "sponsor-report-load";

  return (
    <div className="space-y-3" data-testid="pilot-outcomes-load-failure">
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} role="alert">
        {props.message}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="pilot-outcomes-load-retry"
        onClick={props.onRetry}
      >
        {PILOT_OUTCOMES_LOAD_RETRY_LABEL}
      </Button>
      <FatalPageReportProblemSupportRow
        surfaceId="sponsor-value-report-load-failure"
        errorTitle="Sponsor report could not load"
        correlationId={correlationId}
        errorCode="sponsor-report-load-failure"
      />
    </div>
  );
}
