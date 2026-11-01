import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_INVESTIGATION_EFFORT_GUARDRAIL,
  SECURENOW_INVESTIGATION_EFFORT_HEADING,
  SECURENOW_INVESTIGATION_EFFORT_LEAD,
  SECURENOW_INVESTIGATION_EFFORT_NOTES,
} from "@/lib/product-line/securenow-investigation-effort-copy";

export function SecureNowInvestigationEffortPageView(): React.JSX.Element {
  return (
    <OperatorPageContainer
      variant="full"
      data-testid="securenow-investigation-effort-page"
    >
      <OperatorPageHeader
        title={SECURENOW_INVESTIGATION_EFFORT_HEADING}
        subtitle={SECURENOW_INVESTIGATION_EFFORT_LEAD}
      />

      <main className="mt-6 max-w-3xl space-y-6">
        <section
          aria-labelledby="securenow-investigation-effort-notes-heading"
          className="space-y-2"
        >
          <h2
            id="securenow-investigation-effort-notes-heading"
            className={OPERATOR_TYPOGRAPHY.cardTitle}
          >
            Four notes
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            {SECURENOW_INVESTIGATION_EFFORT_NOTES.map((note) => (
              <li key={note.href} className={OPERATOR_TYPOGRAPHY.body}>
                <a className={OPERATOR_LINK.inline} href={note.href}>
                  {note.label}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <p className={OPERATOR_TYPOGRAPHY.body}>
          {SECURENOW_INVESTIGATION_EFFORT_GUARDRAIL}
        </p>
      </main>
    </OperatorPageContainer>
  );
}
