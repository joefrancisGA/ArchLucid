import Link from "next/link";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_READOUT_PACK_DRAFT_PATTERNS,
  SECURENOW_READOUT_PACK_FIXTURE_ANCHORS,
  SECURENOW_READOUT_PACK_GUARDRAIL,
  SECURENOW_READOUT_PACK_HEADING,
  SECURENOW_READOUT_PACK_LEAD,
} from "@/lib/product-line/securenow-readout-pack-copy";

export function SecureNowReadoutPackPageView(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="full" data-testid="securenow-readout-pack-page">
      <OperatorPageHeader title={SECURENOW_READOUT_PACK_HEADING} subtitle={SECURENOW_READOUT_PACK_LEAD} />

      <main className="mt-6 max-w-4xl space-y-6">
        <section aria-labelledby="securenow-readout-pack-fixtures-heading" className="space-y-3">
          <h2 id="securenow-readout-pack-fixtures-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Fixture readout anchors
          </h2>
          <ul className="m-0 list-none space-y-3 p-0">
            {SECURENOW_READOUT_PACK_FIXTURE_ANCHORS.map((anchor) => (
              <li
                key={anchor.href}
                className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
                data-testid="securenow-readout-pack-fixture-row"
              >
                <p className={OPERATOR_TYPOGRAPHY.body}>
                  <Link className={OPERATOR_LINK.inline} href={anchor.href}>
                    {anchor.label}
                  </Link>
                </p>
                <p className={cnMutedHelper()}>{anchor.summary}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="securenow-readout-pack-patterns-heading" className="space-y-3">
          <h2 id="securenow-readout-pack-patterns-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Draft remediation patterns
          </h2>
          <ul className="m-0 list-none space-y-3 p-0">
            {SECURENOW_READOUT_PACK_DRAFT_PATTERNS.map((pattern) => (
              <li
                key={pattern.href}
                className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
                data-testid="securenow-readout-pack-pattern-row"
              >
                <p className={OPERATOR_TYPOGRAPHY.body}>
                  <Link className={OPERATOR_LINK.inline} href={pattern.href}>
                    {pattern.label}
                  </Link>
                </p>
                <p className={cnMutedHelper()}>{pattern.summary}</p>
              </li>
            ))}
          </ul>
        </section>

        <p className={OPERATOR_TYPOGRAPHY.body}>{SECURENOW_READOUT_PACK_GUARDRAIL}</p>
        <p className={OPERATOR_TYPOGRAPHY.body}>
          <Link className={OPERATOR_LINK.inline} href="/securenow-sample">
            Public sample beats
          </Link>
          {" · "}
          <Link className={OPERATOR_LINK.inline} href="/">
            Back to Home
          </Link>
        </p>
      </main>
    </OperatorPageContainer>
  );
}

function cnMutedHelper(): string {
  return `${OPERATOR_TYPOGRAPHY.helper} m-0 mt-1 text-al-text-secondary`;
}
