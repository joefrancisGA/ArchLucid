import Link from "next/link";

import { AlertsInboxRankCue } from "@/components/EnterpriseControlsContextHints";
import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorTryNext } from "@/components/OperatorShellMessage";
import {
  alertsPageLeadOperator,
  alertsPageLeadReader,
} from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { shouldMergeOperatorDemoAlertSample } from "@/lib/operator-static-demo";
import { cn } from "@/lib/utils";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";

export type AlertsInboxPageIntroProps = {
  readonly canMutateAlertInbox: boolean;
  readonly buyerPolishedShell: boolean;
  readonly failure: ApiLoadFailureState | null;
};

export function AlertsInboxPageIntro({ canMutateAlertInbox, buyerPolishedShell, failure }: AlertsInboxPageIntroProps) {
  return (
    <>
      <LayerHeader pageKey="alerts" />
      <div className="mb-0 flex flex-wrap items-center gap-2">
        <h2 className={cn("m-0 tracking-tight text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>Alerts</h2>
      </div>
      <p className={cn("max-w-prose leading-snug text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        {canMutateAlertInbox ? alertsPageLeadOperator : alertsPageLeadReader}
      </p>
      <p className={cn("mt-2 max-w-prose leading-snug text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        Deduplicated architecture-risk alerts in this workspace. Acknowledge or resolve items tied to findings in scope.
        Each card links a risk signal to a <GlossaryTooltip termKey="findings">finding</GlossaryTooltip> in scope so
        you can triage, acknowledge, or resolve.
      </p>
      {!canMutateAlertInbox ? <AlertsInboxRankCue /> : null}

      {buyerPolishedShell && shouldMergeOperatorDemoAlertSample() ? (
        <div
          className={cn(
            "mb-4 max-w-prose rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800",
            OPERATOR_TYPOGRAPHY.body,
          )}
          role="status"
        >
          <strong className="font-semibold">Sample inbox.</strong> This alert ties drift detection to the PHI minimization
          finding — controls below stay read-only in this walkthrough.
        </div>
      ) : null}

      {failure !== null ? (
        <div className="mb-4" role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
          />
          <OperatorTryNext>
            Confirm the API and proxy are up, then click <strong>Refresh</strong>. Alerts come from scheduled scans—if
            the list should not be empty, check worker schedules and open <Link className={OPERATOR_LINK.nav} href="/help">Help</Link>{" "}
            for environment guidance.
          </OperatorTryNext>
        </div>
      ) : null}
    </>
  );
}
