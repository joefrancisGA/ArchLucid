import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_INVESTIGATION_EFFORT_SYNTHETIC_EXAMPLE_FIELDS,
  SECURENOW_INVESTIGATION_EFFORT_SYNTHETIC_EXAMPLE_HEADING,
  SECURENOW_INVESTIGATION_EFFORT_SYNTHETIC_EXAMPLE_LEAD,
  SECURENOW_INVESTIGATION_EFFORT_SYNTHETIC_EXAMPLE_RESULT,
} from "@/lib/product-line/securenow-investigation-effort-copy";

export type SecureNowInvestigationEffortSyntheticExamplePanelProps = {
  readonly testId?: string;
  readonly headingId?: string;
};

/** Shared synthetic ROI walkthrough — sponsor path and administration page reuse the same honesty copy. */
export function SecureNowInvestigationEffortSyntheticExamplePanel(
  props: SecureNowInvestigationEffortSyntheticExamplePanelProps,
): React.JSX.Element {
  const testId = props.testId ?? "securenow-investigation-effort-synthetic-example";
  const headingId = props.headingId ?? `${testId}-heading`;

  return (
    <section
      aria-labelledby={headingId}
      className="space-y-2 rounded border border-dashed border-border p-3"
      data-testid={testId}
    >
      <h3 id={headingId} className={OPERATOR_TYPOGRAPHY.cardTitle}>
        {SECURENOW_INVESTIGATION_EFFORT_SYNTHETIC_EXAMPLE_HEADING}
      </h3>
      <p className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_INVESTIGATION_EFFORT_SYNTHETIC_EXAMPLE_LEAD}</p>
      <ul className={OPERATOR_TYPOGRAPHY.helper}>
        <li>B = {SECURENOW_INVESTIGATION_EFFORT_SYNTHETIC_EXAMPLE_FIELDS.baselineHours}</li>
        <li>A = {SECURENOW_INVESTIGATION_EFFORT_SYNTHETIC_EXAMPLE_FIELDS.afterHours}</li>
        <li>N = {SECURENOW_INVESTIGATION_EFFORT_SYNTHETIC_EXAMPLE_FIELDS.annualInvestigations}</li>
        <li>R = {SECURENOW_INVESTIGATION_EFFORT_SYNTHETIC_EXAMPLE_FIELDS.hourlyRate}</li>
        <li>C = {SECURENOW_INVESTIGATION_EFFORT_SYNTHETIC_EXAMPLE_FIELDS.annualCost}</li>
      </ul>
      <p className={OPERATOR_TYPOGRAPHY.body}>{SECURENOW_INVESTIGATION_EFFORT_SYNTHETIC_EXAMPLE_RESULT}</p>
    </section>
  );
}
