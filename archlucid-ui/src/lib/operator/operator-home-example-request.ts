/** Canonical review-intake example templates — shared by home card copy and `/architecture/reviews/new` prefill. */
export type ReviewIntakeExampleTemplate = {
  readonly id: string;
  /** Legacy `?example=` query alias (optional). */
  readonly legacyExampleQueryValue?: string;
  readonly title: string;
  readonly briefText: string;
  readonly businessOutcome: string;
  readonly systemName: string;
  /** Quick review vertical sample id when sample-brief mode should be highlighted. */
  readonly quickReviewSampleBriefId?: string;
};

export const REVIEW_INTAKE_EXAMPLE_TEMPLATES: readonly ReviewIntakeExampleTemplate[] = [
  {
    id: "saas-readiness",
    title: "SaaS readiness",
    briefText:
      "Evaluate a multi-tenant SaaS architecture for enterprise readiness — identity and access, tenant isolation, resilience, data protection, and operational monitoring. Include your cloud context, evidence uploads, and any policy packs you plan to apply.",
    businessOutcome:
      "An evidence-backed SaaS readiness review with prioritized findings and recommendations for secure, reliable enterprise use.",
    systemName: "SaaS Platform",
  },
  {
    id: "ai-governance",
    title: "AI governance",
    briefText:
      "Evaluate an AI or ML solution against responsible-AI expectations — model and data risk, transparency, human oversight, privacy, monitoring, and export readiness. Describe inference, training boundaries, and governance controls you need reviewed.",
    businessOutcome:
      "An AI governance review with evidence-backed findings and clear approval decisions for stakeholders.",
    systemName: "AI Solution",
    quickReviewSampleBriefId: "ai",
  },
  {
    id: "customer-intake-modernization",
    legacyExampleQueryValue: "healthcare-claims-intake",
    title: "Enterprise customer intake",
    briefText:
      "Review the architecture for an enterprise customer intake modernization — controlled REST ingestion, validation pipeline, and privacy-boundary data handling for regulated customer work.",
    businessOutcome:
      "Modernize customer intake with compliant ingestion, validation controls, and privacy-boundary data minimization for enterprise stakeholders.",
    systemName: "Enterprise Customer Intake Modernization",
    quickReviewSampleBriefId: "healthcare",
  },
] as const;

const CUSTOMER_INTAKE_MODERNIZATION_TEMPLATE =
  REVIEW_INTAKE_EXAMPLE_TEMPLATES.find((row) => row.id === "customer-intake-modernization") ??
  REVIEW_INTAKE_EXAMPLE_TEMPLATES[REVIEW_INTAKE_EXAMPLE_TEMPLATES.length - 1]!;

/** Primary template id for the operator home Example request panel. */
export const OPERATOR_HOME_EXAMPLE_TEMPLATE_ID = CUSTOMER_INTAKE_MODERNIZATION_TEMPLATE.id;

/** @deprecated Prefer `OPERATOR_HOME_EXAMPLE_TEMPLATE_ID` with `?template=`. Legacy `?example=` alias. */
export const OPERATOR_HOME_EXAMPLE_QUERY_VALUE =
  CUSTOMER_INTAKE_MODERNIZATION_TEMPLATE.legacyExampleQueryValue ?? CUSTOMER_INTAKE_MODERNIZATION_TEMPLATE.id;

/** Long-form brief shown on home and prefilled into review intake when the template matches. */
export const OPERATOR_HOME_EXAMPLE_DESCRIPTION = CUSTOMER_INTAKE_MODERNIZATION_TEMPLATE.briefText;

/** Title / system name prefilled on review intake when the template matches. */
export const OPERATOR_HOME_EXAMPLE_SYSTEM_NAME = CUSTOMER_INTAKE_MODERNIZATION_TEMPLATE.systemName;

/** Home card CTA — promise matches prefill behavior on `/architecture/reviews/new`. */
export const OPERATOR_HOME_EXAMPLE_START_CTA = "Start from this example";

/**
 * Matched case-insensitively on run descriptions (with the static demo run id) so the home ribbon can find the
 * showcase story when the reviews API returns real rows instead of the static fallback.
 */
export const OPERATOR_HOME_EXAMPLE_RUN_DESCRIPTION_TOKEN = "customer intake";

export function reviewIntakeExampleTemplateHref(templateId: string): string {
  return `/architecture/reviews/new?template=${encodeURIComponent(templateId)}`;
}

export function resolveReviewIntakeExampleTemplate(input: {
  templateParam?: string | null;
  exampleParam?: string | null;
}): ReviewIntakeExampleTemplate | null {
  const templateKey = input.templateParam?.trim().toLowerCase() ?? "";

  if (templateKey.length > 0) {
    const match = REVIEW_INTAKE_EXAMPLE_TEMPLATES.find((row) => row.id.toLowerCase() === templateKey);

    return match ?? null;
  }

  const exampleKey = input.exampleParam?.trim().toLowerCase() ?? "";

  if (exampleKey.length === 0) {
    return null;
  }

  return (
    REVIEW_INTAKE_EXAMPLE_TEMPLATES.find((row) => row.legacyExampleQueryValue?.toLowerCase() === exampleKey) ?? null
  );
}

export function resolveReviewIntakeExampleTemplateFromSearchParams(
  readParam: (key: string) => string | null,
): { template: ReviewIntakeExampleTemplate | null; invalidTemplateId: string | null } {
  const templateParam = readParam("template");

  if (templateParam !== null && templateParam.trim().length > 0) {
    const template = resolveReviewIntakeExampleTemplate({ templateParam });

    if (template === null) {
      return { template: null, invalidTemplateId: templateParam.trim() };
    }

    return { template, invalidTemplateId: null };
  }

  const template = resolveReviewIntakeExampleTemplate({ exampleParam: readParam("example") });

  return { template, invalidTemplateId: null };
}
