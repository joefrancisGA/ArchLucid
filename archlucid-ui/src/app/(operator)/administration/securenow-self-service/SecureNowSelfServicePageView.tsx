import Link from "next/link";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_SELF_SERVICE_GUARDRAIL,
  SECURENOW_SELF_SERVICE_HEADING,
  SECURENOW_SELF_SERVICE_LEAD,
  SECURENOW_SELF_SERVICE_STEPS,
} from "@/lib/product-line/securenow-self-service-copy";

export function SecureNowSelfServicePageView(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="full" data-testid="securenow-self-service-page">
      <OperatorPageHeader title={SECURENOW_SELF_SERVICE_HEADING} subtitle={SECURENOW_SELF_SERVICE_LEAD} />

      <main className="mt-6 max-w-3xl space-y-6">
        <section aria-labelledby="securenow-self-service-steps-heading" className="space-y-2">
          <h2 id="securenow-self-service-steps-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Four checks
          </h2>
          <ol className="list-decimal space-y-3 pl-5">
            {SECURENOW_SELF_SERVICE_STEPS.map((step) => (
              <li key={step.title} id={step.id} className={OPERATOR_TYPOGRAPHY.body}>
                <span className="font-medium">{step.title}</span>
                <span> — {step.body}</span>
                {step.href ? (
                  <>
                    {" "}
                    <Link className={OPERATOR_LINK.inline} href={step.href}>
                      {step.secondaryHref ? "Open Priorities & waves" : "Open in product"}
                    </Link>
                  </>
                ) : null}
                {step.secondaryHref ? (
                  <>
                    {" "}
                    <Link className={OPERATOR_LINK.inline} href={step.secondaryHref}>
                      Open remediation tracker
                    </Link>
                  </>
                ) : null}
                {step.mailto ? (
                  <>
                    {" "}
                    <Link className={OPERATOR_LINK.inline} href={step.mailto}>
                      Email support
                    </Link>
                  </>
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        <p className={OPERATOR_TYPOGRAPHY.body}>{SECURENOW_SELF_SERVICE_GUARDRAIL}</p>
      </main>
    </OperatorPageContainer>
  );
}
