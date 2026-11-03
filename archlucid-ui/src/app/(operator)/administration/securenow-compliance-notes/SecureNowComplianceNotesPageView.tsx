import Link from "next/link";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_COMPLIANCE_NOTES_DUTIES,
  SECURENOW_COMPLIANCE_NOTES_GUARDRAIL,
  SECURENOW_COMPLIANCE_NOTES_HEADING,
  SECURENOW_COMPLIANCE_NOTES_LEAD,
  SECURENOW_COMPLIANCE_NOTES_LINKS,
  SECURENOW_COMPLIANCE_NOTES_EXPECTATION_KEYS_LEAD,
  SECURENOW_COMPLIANCE_NOTES_NAMED_EXPECTATION_KEYS,
  SECURENOW_COMPLIANCE_NOTES_PACKS,
} from "@/lib/product-line/securenow-compliance-notes-copy";

export function SecureNowComplianceNotesPageView(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="full" data-testid="securenow-compliance-notes-page">
      <OperatorPageHeader title={SECURENOW_COMPLIANCE_NOTES_HEADING} subtitle={SECURENOW_COMPLIANCE_NOTES_LEAD} />

      <main className="mt-6 max-w-3xl space-y-6">
        <section aria-labelledby="securenow-compliance-duties-heading" className="space-y-2">
          <h2 id="securenow-compliance-duties-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Responsibility
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            {SECURENOW_COMPLIANCE_NOTES_DUTIES.map(([title, body]) => (
              <li key={title} className={OPERATOR_TYPOGRAPHY.body}>
                <span className="font-medium">{title}</span>
                <span> — {body}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="securenow-compliance-coverage-heading" className="space-y-2">
          <h2 id="securenow-compliance-coverage-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Framework coverage
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            {SECURENOW_COMPLIANCE_NOTES_PACKS.map((pack) => (
              <li key={pack} className={OPERATOR_TYPOGRAPHY.body}>
                {pack}
              </li>
            ))}
          </ul>
          <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="securenow-compliance-expectation-keys-lead">
            {SECURENOW_COMPLIANCE_NOTES_EXPECTATION_KEYS_LEAD}
          </p>
          <ul
            className="list-disc space-y-1 pl-5"
            data-testid="securenow-compliance-named-expectation-keys"
          >
            {SECURENOW_COMPLIANCE_NOTES_NAMED_EXPECTATION_KEYS.map((key) => (
              <li key={key} className={OPERATOR_TYPOGRAPHY.helper}>
                {key}
              </li>
            ))}
          </ul>
          <p className={OPERATOR_TYPOGRAPHY.body}>A mapping is not a certification.</p>
        </section>

        <section aria-labelledby="securenow-compliance-links-heading" className="space-y-2">
          <h2 id="securenow-compliance-links-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Source notes
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            {SECURENOW_COMPLIANCE_NOTES_LINKS.map((link) => (
              <li key={link.href} className={OPERATOR_TYPOGRAPHY.body}>
                <Link className={OPERATOR_LINK.inline} href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <p className={OPERATOR_TYPOGRAPHY.body}>{SECURENOW_COMPLIANCE_NOTES_GUARDRAIL}</p>
      </main>
    </OperatorPageContainer>
  );
}
