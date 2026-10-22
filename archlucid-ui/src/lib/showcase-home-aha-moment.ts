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
    "Sensitive customer profile attributes cross the intake API boundary without field-level encryption required by downstream fulfillment services.",
  whyItMatters:
    "Downstream fulfillment only needs work identifiers — transmitting optional profile attributes expands breach scope and audit exposure under enterprise privacy policy.",
  evidenceSupport:
    "Architecture brief data-flow diagram plus enterprise privacy pack rule: sensitive customer data must be minimized at the intake boundary.",
  decisionChange:
    "Defer ARB approval until intake strips non-essential profile attributes before the internal fulfillment API handoff.",
};

export function showcasePrimaryFindingHref(runId: string): string {
  return showcasePrimaryFindingDetailHref(runId, SHOWCASE_HOME_AHA_MOMENT.id);
}
