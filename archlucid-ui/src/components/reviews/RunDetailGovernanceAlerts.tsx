import type { RunDetail } from "@/types/authority";

type RunDetailGovernanceAlertsProps = {
  readonly run: RunDetail["run"];
  readonly hasCommitBlockingFailures?: boolean;
};

/** Surfaces governance warnings and last failure before commit (TB-107). */
export function RunDetailGovernanceAlerts(props: RunDetailGovernanceAlertsProps): React.JSX.Element | null {
  const { run } = props;
  const hasGovernanceWarnings = (run as { hasGovernanceWarnings?: boolean }).hasGovernanceWarnings === true;
  const lastFailureReason = (run as { lastFailureReason?: string | null }).lastFailureReason?.trim();

  if (!hasGovernanceWarnings && !lastFailureReason) {
    return null;
  }

  return (
    <div className="space-y-3" data-testid="run-detail-governance-alerts">
      {hasGovernanceWarnings ? (
        <div
          className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
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
          className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-950 dark:border-red-700 dark:bg-red-950/40 dark:text-red-100"
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
