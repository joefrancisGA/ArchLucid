import Link from "next/link";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_PILOT_DECISION_GUARDRAIL,
  SECURENOW_PILOT_DECISION_HEADING,
  SECURENOW_PILOT_DECISION_LEAD,
  SECURENOW_PILOT_DECISION_OUTCOMES,
  SECURENOW_PILOT_DECISION_STEPS,
} from "@/lib/product-line/securenow-pilot-decision-copy";

export function SecureNowPilotDecisionPageView(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="full" data-testid="securenow-pilot-decision-page">
      <OperatorPageHeader title={SECURENOW_PILOT_DECISION_HEADING} subtitle={SECURENOW_PILOT_DECISION_LEAD} />

      <main className="mt-6 max-w-3xl space-y-6">
        <section aria-labelledby="securenow-pilot-decision-steps-heading" className="space-y-2">
          <h2 id="securenow-pilot-decision-steps-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Close the review
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            {SECURENOW_PILOT_DECISION_STEPS.map((step) => (
              <li key={step} className={OPERATOR_TYPOGRAPHY.body}>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="securenow-pilot-decision-outcomes-heading" className="space-y-2">
          <h2 id="securenow-pilot-decision-outcomes-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Outcome meanings
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            {SECURENOW_PILOT_DECISION_OUTCOMES.map((outcome) => (
              <li key={outcome} className={OPERATOR_TYPOGRAPHY.body}>
                {outcome}
              </li>
            ))}
          </ul>
        </section>

        <p className={OPERATOR_TYPOGRAPHY.body}>{SECURENOW_PILOT_DECISION_GUARDRAIL}</p>
        <p className={OPERATOR_TYPOGRAPHY.body}>
          <Link className={OPERATOR_LINK.inline} href="/why-securenow#pilot-decision">
            Read the sponsor-facing decision path
          </Link>
        </p>
      </main>
    </OperatorPageContainer>
  );
}
