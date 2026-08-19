import Link from "next/link";

import { AlertsInboxRankCue } from "@/components/EnterpriseControlsContextHints";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorTryNext } from "@/components/operator/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import {
  ALERTS_INBOX_LOAD_ERROR,
  ALERTS_INBOX_LOAD_ERROR_RETRY_LABEL,
} from "@/lib/alerts-inbox-page-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { shouldMergeOperatorDemoAlertSample } from "@/lib/operator/operator-static-demo";
import { cn } from "@/lib/utils";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";

export type AlertsInboxPageIntroProps = {
  readonly canMutateAlertInbox: boolean;
  readonly buyerPolishedShell: boolean;
  readonly failure: ApiLoadFailureState | null;
  readonly onRetry?: () => void;
};

export function AlertsInboxPageIntro({
  canMutateAlertInbox,
  buyerPolishedShell,
  failure,
  onRetry,
}: AlertsInboxPageIntroProps) {
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
        <div
          className="mb-4"
          role="alert"
          data-testid={buyerPolishedShell ? "alerts-inbox-load-error" : undefined}
        >
          {buyerPolishedShell ? (
            <>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{ALERTS_INBOX_LOAD_ERROR}</p>
              {onRetry ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  data-testid="alerts-inbox-load-retry"
                  onClick={onRetry}
                >
                  {ALERTS_INBOX_LOAD_ERROR_RETRY_LABEL}
                </Button>
              ) : null}
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      ) : null}
    </>
  );
}
