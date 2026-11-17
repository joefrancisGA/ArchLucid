import Link from "next/link";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_RETURN_REASONS_GUARDRAIL,
  SECURENOW_RETURN_REASONS_HEADING,
  SECURENOW_RETURN_REASONS_LEAD,
  SECURENOW_RETURN_REASONS_ROWS,
} from "@/lib/product-line/securenow-return-reasons-copy";

export function SecureNowReturnReasonsPageView(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="full" data-testid="securenow-return-reasons-page">
      <OperatorPageHeader title={SECURENOW_RETURN_REASONS_HEADING} subtitle={SECURENOW_RETURN_REASONS_LEAD} />

      <main className="mt-6 max-w-3xl space-y-6">
        <section aria-labelledby="securenow-return-reasons-list-heading" className="space-y-2">
          <h2 id="securenow-return-reasons-list-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Existing work queues
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            {SECURENOW_RETURN_REASONS_ROWS.map((row) => (
              <li key={row.href} className={OPERATOR_TYPOGRAPHY.body}>
                <Link className={OPERATOR_LINK.inline} href={row.href}>
                  {row.label}
                </Link>
                <span> — {row.summary}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className={OPERATOR_TYPOGRAPHY.body}>{SECURENOW_RETURN_REASONS_GUARDRAIL}</p>
        <p className={OPERATOR_TYPOGRAPHY.body}>
          <Link className={OPERATOR_LINK.inline} href="/">
            Back to Home
          </Link>
        </p>
      </main>
    </OperatorPageContainer>
  );
}
