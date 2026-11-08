import Link from "next/link";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SECURENOW_SAMPLE_SECOND_FIXTURE_SECTION_ID } from "@/lib/marketing/securenow-sample-copy";
import {
  SECURENOW_SCENARIO_WALKS,
  SECURENOW_SCENARIO_WALKS_GUARDRAIL,
  SECURENOW_SCENARIO_WALKS_HEADING,
  SECURENOW_SCENARIO_WALKS_LEAD,
} from "@/lib/product-line/securenow-scenario-walks-copy";

export function SecureNowScenarioWalksPageView(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="full" data-testid="securenow-scenario-walks-page">
      <OperatorPageHeader title={SECURENOW_SCENARIO_WALKS_HEADING} subtitle={SECURENOW_SCENARIO_WALKS_LEAD} />

      <main className="mt-6 max-w-4xl space-y-6">
        <section aria-labelledby="securenow-scenario-walks-list-heading" className="space-y-2">
          <h2 id="securenow-scenario-walks-list-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Six scenarios
          </h2>
          <ul className="space-y-4">
            {SECURENOW_SCENARIO_WALKS.map((scenario) => (
              <li
                key={scenario.id}
                id={scenario.id}
                className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
              >
                <p className={OPERATOR_TYPOGRAPHY.body}>
                  <span className="font-medium">{scenario.id}</span>
                </p>
                <p className={OPERATOR_TYPOGRAPHY.body}>{scenario.buyerJob}</p>
                <p className={OPERATOR_TYPOGRAPHY.helper}>
                  Honest label: {scenario.honestLabel}
                </p>
                {scenario.id === "fixture-path-02" ? (
                  <p className={OPERATOR_TYPOGRAPHY.body}>
                    <Link
                      className={OPERATOR_LINK.inline}
                      href={`/securenow-sample#${SECURENOW_SAMPLE_SECOND_FIXTURE_SECTION_ID}`}
                    >
                      Open fixture-path-02 on the public sample
                    </Link>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <p className={OPERATOR_TYPOGRAPHY.body}>{SECURENOW_SCENARIO_WALKS_GUARDRAIL}</p>
        <p className={OPERATOR_TYPOGRAPHY.body}>
          <Link className={OPERATOR_LINK.inline} href="/">
            Back to Home
          </Link>
        </p>
      </main>
    </OperatorPageContainer>
  );
}
