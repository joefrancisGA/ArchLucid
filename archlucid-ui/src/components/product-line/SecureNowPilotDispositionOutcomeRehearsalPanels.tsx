import Link from "next/link";

import { SecureNowInvestigationEffortSyntheticExamplePanel } from "@/components/product-line/SecureNowInvestigationEffortSyntheticExamplePanel";
import { SecureNowPilotStopItsmHandoffBlock } from "@/components/product-line/SecureNowPilotStopItsmHandoffBlock";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_PILOT_DECISION_EXTEND_ROI_HREF,
  SECURENOW_PILOT_DECISION_EXTEND_ROI_LEAD,
  SECURENOW_PILOT_DECISION_EXTEND_ROI_LINK_LABEL,
  SECURENOW_PILOT_DECISION_PROCEED_COMMERCIAL_LEAD,
  SECURENOW_PILOT_DECISION_PROCEED_QUOTE_HREF,
  SECURENOW_PILOT_DECISION_PROCEED_QUOTE_LABEL,
  SECURENOW_PILOT_DECISION_PROCEED_REVIEWER_HREF,
  SECURENOW_PILOT_DECISION_PROCEED_REVIEWER_LABEL,
  SECURENOW_PILOT_DECISION_STOP_DRAFT_LEAD,
} from "@/lib/product-line/securenow-pilot-decision-copy";

export type SecureNowPilotDispositionOutcomeRehearsalPanelsProps = {
  readonly outcome: string;
  readonly savedOutcome: string | null;
  readonly savedRationale: string | null;
  readonly pathId: string;
  readonly testIdPrefix: string;
  readonly stopHandoffTestId: string;
};

/** Proceed / Extend / Stop rehearsal blocks shared by pilot decision and sponsor path. */
export function SecureNowPilotDispositionOutcomeRehearsalPanels(
  props: SecureNowPilotDispositionOutcomeRehearsalPanelsProps,
): React.JSX.Element {
  const savedOutcome = props.savedOutcome?.trim() ?? "";
  const selectedOutcome = props.outcome.trim();

  return (
    <>
      {selectedOutcome === "Stop" && savedOutcome !== "Stop" ? (
        <p className={OPERATOR_TYPOGRAPHY.helper} data-testid={`${props.testIdPrefix}-stop-draft`}>
          {SECURENOW_PILOT_DECISION_STOP_DRAFT_LEAD}
        </p>
      ) : null}
      {savedOutcome === "Stop" && props.savedRationale !== null ? (
        <SecureNowPilotStopItsmHandoffBlock
          pathId={props.pathId}
          rationale={props.savedRationale}
          handoffTestId={props.stopHandoffTestId}
        />
      ) : null}
      {selectedOutcome === "Proceed" || savedOutcome === "Proceed" ? (
        <div className="space-y-2" data-testid={`${props.testIdPrefix}-proceed-commercial`}>
          <p className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_PILOT_DECISION_PROCEED_COMMERCIAL_LEAD}</p>
          <p className={OPERATOR_TYPOGRAPHY.body}>
            <Link className={OPERATOR_LINK.inline} href={SECURENOW_PILOT_DECISION_PROCEED_QUOTE_HREF}>
              {SECURENOW_PILOT_DECISION_PROCEED_QUOTE_LABEL}
            </Link>
            {" · "}
            <Link className={OPERATOR_LINK.inline} href={SECURENOW_PILOT_DECISION_PROCEED_REVIEWER_HREF}>
              {SECURENOW_PILOT_DECISION_PROCEED_REVIEWER_LABEL}
            </Link>
          </p>
        </div>
      ) : null}
      {selectedOutcome === "Extend" || savedOutcome === "Extend" ? (
        <div className="space-y-2" data-testid={`${props.testIdPrefix}-extend-roi`}>
          <p className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_PILOT_DECISION_EXTEND_ROI_LEAD}</p>
          <p className={OPERATOR_TYPOGRAPHY.body}>
            <Link className={OPERATOR_LINK.inline} href={SECURENOW_PILOT_DECISION_EXTEND_ROI_HREF}>
              {SECURENOW_PILOT_DECISION_EXTEND_ROI_LINK_LABEL}
            </Link>
          </p>
          <SecureNowInvestigationEffortSyntheticExamplePanel
            testId={`${props.testIdPrefix}-synthetic-roi`}
            headingId={`${props.testIdPrefix}-synthetic-roi-heading`}
          />
        </div>
      ) : null}
    </>
  );
}
