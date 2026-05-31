import { DESIGN_TOKENS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { RunDetail } from "@/types/authority";

type RunDetailGovernanceAlertsProps = {
  readonly run: RunDetail["run"];
  readonly hasCommitBlockingFailures?: boolean;
};

/** Surfaces governance warnings and last failure before commit (TB-107). */
export function RunDetailGovernanceAlerts(props: RunDetailGovernanceAlertsProps): React.JSX.Element | null {
  const { run } = props;
  const hasGovernanceWarnings = run.hasGovernanceWarnings === true;
  const lastFailureReason = run.lastFailureReason?.trim();

  if (!hasGovernanceWarnings && !lastFailureReason) {
    return null;
  }

  return (
    <div className="space-y-3" data-testid="run-detail-governance-alerts">
      {hasGovernanceWarnings ? (
        <div
          className={cn(DESIGN_TOKENS.callout.warn, "px-4 py-3")}
          role="alert"
          data-testid="run-detail-governance-warning-banner"
        >
          <p className="m-0 font-semibold">Governance warnings</p>
          <p className="m-0 mt-1">
            Open governance alerts are linked to this review. Resolve or document exceptions before sponsor handoff.
          </p>
        </div>
      ) : null}

      {lastFailureReason ? (
        <div
          className={cn(DESIGN_TOKENS.callout.blocked, "px-4 py-3")}
          role="alert"
          data-testid="run-detail-last-failure-reason"
        >
          <p className="m-0 font-semibold">Last failure reason</p>
          <p className="m-0 mt-1">{lastFailureReason}</p>
        </div>
      ) : null}
    </div>
  );
}
