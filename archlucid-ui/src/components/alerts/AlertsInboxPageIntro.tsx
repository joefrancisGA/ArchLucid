import Link from "next/link";

import { AlertsInboxRankCue } from "@/components/EnterpriseControlsContextHints";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorTryNext } from "@/components/OperatorShellMessage";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { shouldMergeOperatorDemoAlertSample } from "@/lib/operator/operator-static-demo";
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
      {buyerPolishedShell && shouldMergeOperatorDemoAlertSample() ? (
        <p
          className={cn("m-0 mb-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}
          role="note"
          data-testid="alerts-inbox-demo-note"
        >
          Demo inbox preview — triage controls may stay read-only in this walkthrough.
        </p>
      ) : null}

      {!canMutateAlertInbox ? (
        <div className="mb-3">
          <AlertsInboxRankCue />
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
