import Link from "next/link";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_FIRST_HOUR_GUARDRAIL,
  SECURENOW_FIRST_HOUR_HEADING,
  SECURENOW_FIRST_HOUR_LEAD,
  SECURENOW_FIRST_HOUR_STEPS,
  SECURENOW_FIRST_HOUR_TERMS,
} from "@/lib/product-line/securenow-first-hour-copy";

export function SecureNowFirstHourPageView(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="full" data-testid="securenow-first-hour-page">
      <OperatorPageHeader title={SECURENOW_FIRST_HOUR_HEADING} subtitle={SECURENOW_FIRST_HOUR_LEAD} />

      <main className="mt-6 max-w-3xl space-y-6">
        <section aria-labelledby="securenow-first-hour-steps-heading" className="space-y-2">
          <h2 id="securenow-first-hour-steps-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Four steps
          </h2>
          <ol className="list-decimal space-y-3 pl-5">
            {SECURENOW_FIRST_HOUR_STEPS.map((step) => (
              <li key={step.title} className={OPERATOR_TYPOGRAPHY.body}>
                <span className="font-medium">{step.title}</span>
                <span> — {step.body}</span>
                {step.href ? (
                  <>
                    {" "}
                    <Link className={OPERATOR_LINK.inline} href={step.href}>
                      Open in product
                    </Link>
                  </>
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="securenow-first-hour-terms-heading" className="space-y-2">
          <h2 id="securenow-first-hour-terms-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Terms in one place
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            {SECURENOW_FIRST_HOUR_TERMS.map((term) => (
              <li key={term} className={OPERATOR_TYPOGRAPHY.body}>
                {term}
              </li>
            ))}
          </ul>
        </section>

        <p className={OPERATOR_TYPOGRAPHY.body}>{SECURENOW_FIRST_HOUR_GUARDRAIL}</p>
        <p className={OPERATOR_TYPOGRAPHY.body}>
          <Link className={OPERATOR_LINK.inline} href="/">
            Back to Home
          </Link>
        </p>
      </main>
    </OperatorPageContainer>
  );
}
