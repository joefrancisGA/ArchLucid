import { cn } from "@/lib/utils";

import { formatFindings, formatHours, safeCommittedRunWindowCount } from "@/components/BeforeAfterDelta/formatDelta";
import type { RecentPilotRunDeltasPayload } from "@/components/BeforeAfterDelta/types";
import { useDeltaQuery } from "@/components/BeforeAfterDelta/useDeltaQuery";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPOGRAPHY, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import type { RunSummary } from "@/types/authority";

export type RunsDashboardOutcomesTabProps = {
  readonly buyerPolishedShell: boolean;
  readonly showcaseDemoRun: RunSummary | undefined;
  readonly deltaData?: RecentPilotRunDeltasPayload | null;
  readonly deltaStatus?: "loading" | "ready" | "error";
};

export function RunsDashboardOutcomesTab(props: RunsDashboardOutcomesTabProps) {
  const internalDelta = useDeltaQuery({ count: 5 });
  const deltaStatus = props.deltaStatus ?? internalDelta.status;
  const deltaData = props.deltaData !== undefined ? props.deltaData : internalDelta.data;
  const outcomesWindow =
    deltaStatus === "ready" && deltaData !== null ? safeCommittedRunWindowCount(deltaData.returnedCount) : null;

  return (
    <div data-testid="command-center-activity-card">
      {props.buyerPolishedShell && props.showcaseDemoRun !== undefined ? (
        <ul
          className="m-0 grid list-none gap-2 p-0 sm:grid-cols-3"
          data-testid="runs-dashboard-buyer-outcome-cards"
        >
          <li className={cn("px-3 py-2", OPERATOR_SURFACE_CARD_CLASS)}>
            <StatusTag kind="ready" label="Outcome" />
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.cardTitle)}>Review finalized</p>
            <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.label)}>
              Signed review record pinned with governance-approved posture for sponsor readout.
            </p>
          </li>
          <li className={cn("px-3 py-2", OPERATOR_SURFACE_CARD_CLASS)}>
            <StatusTag kind="approved-with-monitoring" label="Monitored posture" />
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.cardTitle)}>One non-blocking risk under monitoring</p>
            <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.label)}>
              PHI minimization control accepted with recurring sampling — tracked in monitored risks elsewhere in the
              package.
            </p>
          </li>
          <li className={cn("px-3 py-2", OPERATOR_SURFACE_CARD_CLASS)}>
            <StatusTag kind="neutral" label="Deliverables" />
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.cardTitle)}>Evidence bundle ready</p>
            <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.label)}>
              Sponsor report through audit trail packaged for diligence and CAB-style review inquiries.
            </p>
          </li>
        </ul>
      ) : (
        <>
          {deltaStatus === "loading" ? (
            <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Loading review outcomes…
            </p>
          ) : null}

          {deltaStatus === "error" ? (
            <p className={cn("m-0", OPERATOR_TYPE_SCALE.body, "text-neutral-600 dark:text-neutral-400")}>
              Review outcomes are unavailable right now. Try again later or open the reviews list.
            </p>
          ) : null}

          {deltaStatus === "ready" && deltaData !== null && outcomesWindow !== null && outcomesWindow > 0 ? (
            <dl className={cn("m-0 grid grid-cols-2 gap-2", OPERATOR_TYPOGRAPHY.helper)}>
              <div>
                <dt className={OPERATOR_TYPOGRAPHY.label}>Findings</dt>
                <dd className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
                  {formatFindings(deltaData.medianTotalFindings)}
                </dd>
              </div>
              <div>
                <dt className={OPERATOR_TYPOGRAPHY.label}>Time to finalize</dt>
                <dd className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
                  {formatHours(deltaData.medianTimeToCommittedManifestTotalSeconds)}
                </dd>
              </div>
            </dl>
          ) : null}

          {deltaStatus === "ready" && outcomesWindow === 0 ? (
            <p className={cn("m-0", OPERATOR_TYPE_SCALE.body, "text-neutral-600 dark:text-neutral-400")}>
              After your first finalized review, this panel will show reviews finalized, findings surfaced, and
              average time to finalization.
            </p>
          ) : null}

          {deltaStatus === "ready" && deltaData !== null && outcomesWindow === null ? (
            <p className={cn("m-0", OPERATOR_TYPE_SCALE.body, "text-neutral-600 dark:text-neutral-400")}>
              Review outcomes summary is incomplete. Try again later.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
