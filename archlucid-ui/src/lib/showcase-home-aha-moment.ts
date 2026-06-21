import {
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_TITLE,
} from "@/lib/showcase-static-demo";
import { showcasePrimaryFindingDetailHref } from "@/lib/showcase-sample-review-registry";

/** Four-part first-value moment for sample / demo review surfaces (assessment #2). */
export type ShowcaseHomeAhaMoment = {
  readonly id: string;
  readonly title: string;
  readonly severity: "critical" | "warning" | "info";
  readonly finding: string;
  readonly whyItMatters: string;
  readonly evidenceSupport: string;
  readonly decisionChange: string;
};

/** Primary sample finding — buyer-safe static copy aligned with showcase provenance. */
export const SHOWCASE_HOME_AHA_MOMENT: ShowcaseHomeAhaMoment = {
  id: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  title: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_TITLE,
  severity: "warning",
  finding:
    "PHI fields cross the claims API boundary without field-level encryption required by downstream processors.",
  whyItMatters:
    "Downstream adjudication only needs claim identifiers — transmitting date-of-birth and SSN expands breach scope and audit exposure under HIPAA.",
  evidenceSupport:
    "Architecture brief data-flow diagram plus policy pack rule HIPAA §164.312(a)(2)(iv): PHI must be minimized at the API boundary.",
  decisionChange:
    "Defer ARB approval until intake strips non-essential PHI before the internal claims API handoff.",
};

export function showcasePrimaryFindingHref(runId: string): string {
  return showcasePrimaryFindingDetailHref(runId, SHOWCASE_HOME_AHA_MOMENT.id);
}
