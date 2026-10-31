import Link from "next/link";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_ACCESSIBILITY_BODY,
  SECURENOW_ACCESSIBILITY_HEADING,
  SECURENOW_ACCESSIBILITY_LEAD,
  SECURENOW_ACCESSIBILITY_MAILTO,
  SECURENOW_ACCESSIBILITY_MAILTO_LABEL,
  SECURENOW_ACCESSIBILITY_REFUSAL,
  SECURENOW_ACCESSIBILITY_SURFACES,
} from "@/lib/product-line/securenow-accessibility-copy";

export function SecureNowAccessibilityPageView(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="full" data-testid="securenow-accessibility-page">
      <OperatorPageHeader title={SECURENOW_ACCESSIBILITY_HEADING} subtitle={SECURENOW_ACCESSIBILITY_LEAD} />

      <main className="mt-6 max-w-3xl space-y-6">
        <section aria-labelledby="securenow-accessibility-context-heading" className="space-y-2">
          <h2 id="securenow-accessibility-context-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            SecureNow scope
          </h2>
          <p className={OPERATOR_TYPOGRAPHY.body}>{SECURENOW_ACCESSIBILITY_BODY}</p>
          <p className={OPERATOR_TYPOGRAPHY.body}>{SECURENOW_ACCESSIBILITY_REFUSAL}</p>
        </section>

        <section aria-labelledby="securenow-accessibility-surfaces-heading" className="space-y-2">
          <h2 id="securenow-accessibility-surfaces-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Surfaces in scope
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            {SECURENOW_ACCESSIBILITY_SURFACES.map((surface) => (
              <li key={surface} className={OPERATOR_TYPOGRAPHY.body}>
                {surface}
              </li>
            ))}
          </ul>
        </section>

        <p className={OPERATOR_TYPOGRAPHY.body}>
          <Link className={OPERATOR_LINK.inline} href={SECURENOW_ACCESSIBILITY_MAILTO}>
            {SECURENOW_ACCESSIBILITY_MAILTO_LABEL}
          </Link>
        </p>
      </main>
    </OperatorPageContainer>
  );
}
