"use client";

import { PageHeaderClaimDiscipline } from "@/components/operator/page-header-claim-discipline";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { ALERT_RULES_CONDITIONS_CLAIM_DISCIPLINE } from "@/lib/alert-rules-conditions-evidence-copy";

import { AlertRulesConditionsClaimOrientationStrip } from "./AlertRulesConditionsClaimOrientationStrip";

/** Buyer default: mount claim discipline and Sources orientation after primary Conditions workspace (GLR). */
export function AlertRulesBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="alert-rules-conditions-orientation-bottom">
      <PageHeaderClaimDiscipline
        text={ALERT_RULES_CONDITIONS_CLAIM_DISCIPLINE}
        testId="alert-rules-conditions-claim-discipline"
        className="max-w-prose text-left"
      />
      <AlertRulesConditionsClaimOrientationStrip />
    </div>
  );
}
