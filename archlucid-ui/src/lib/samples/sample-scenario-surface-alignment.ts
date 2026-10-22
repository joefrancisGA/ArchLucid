import {
  AI_KNOWLEDGE_ASSISTANT_CANONICAL_PROOF_HREF,
  AI_KNOWLEDGE_ASSISTANT_SAMPLE_DEFINITION,
  AI_KNOWLEDGE_ASSISTANT_SAMPLE_RUN_ID,
} from "@/lib/samples/ai-knowledge-assistant/definition";
import {
  CLAIMS_INTAKE_CANONICAL_PROOF_HREF,
  CLAIMS_INTAKE_SAMPLE_DEFINITION,
  CLAIMS_INTAKE_SAMPLE_RUN_ID,
} from "@/lib/samples/claims-intake/definition";
import {
  CUSTOMER_INTAKE_CANONICAL_PROOF_HREF,
  CUSTOMER_INTAKE_SAMPLE_DEFINITION,
  CUSTOMER_INTAKE_SAMPLE_RUN_ID,
} from "@/lib/samples/customer-intake-modernization/definition";
import { TRIAL_ONBOARDING_SAMPLE_RUN_ID } from "@/lib/trial-sample-run";

export type SampleScenarioSurfaceRow = {
  readonly surface: string;
  readonly packageSlug: string;
  readonly showcaseRunId: string;
  readonly notes: string;
};

/**
 * Surface → sample package → run id alignment (TB-981 / GTM M-134).
 * Marketing static primary = Enterprise Customer Intake; Claims = regulated-depth secondary; trial SQL = documented co-primary.
 */
export const SAMPLE_SCENARIO_SURFACE_ALIGNMENT: readonly SampleScenarioSurfaceRow[] = [
  {
    surface: "Anonymous marketing proof (`CANONICAL_ANONYMOUS_PROOF_HREF`, `/see-it`, `/welcome`, `/why`)",
    packageSlug: CUSTOMER_INTAKE_SAMPLE_DEFINITION.slug,
    showcaseRunId: CUSTOMER_INTAKE_SAMPLE_RUN_ID,
    notes: "Primary buyer-facing static showcase after TB-981 default flip.",
  },
  {
    surface: "Healthcare get-started vertical `publicSampleHref`",
    packageSlug: CLAIMS_INTAKE_SAMPLE_DEFINITION.slug,
    showcaseRunId: CLAIMS_INTAKE_SAMPLE_RUN_ID,
    notes: "Regulated-depth secondary; deep link only for healthcare vertical framing.",
  },
  {
    surface: "Non-healthcare get-started verticals `publicSampleHref`",
    packageSlug: CUSTOMER_INTAKE_SAMPLE_DEFINITION.slug,
    showcaseRunId: CUSTOMER_INTAKE_SAMPLE_RUN_ID,
    notes: "Generic enterprise intake primary sample.",
  },
  {
    surface: "Claims regulated-depth showcase (`SECONDARY_CLAIMS_PROOF_HREF`)",
    packageSlug: CLAIMS_INTAKE_SAMPLE_DEFINITION.slug,
    showcaseRunId: CLAIMS_INTAKE_SAMPLE_RUN_ID,
    notes: "Explicit secondary deep link; not deleted per TB-981 guardrail.",
  },
  {
    surface: "AI Knowledge Assistant created showcase (`AI_KNOWLEDGE_ASSISTANT_CANONICAL_PROOF_HREF`)",
    packageSlug: AI_KNOWLEDGE_ASSISTANT_SAMPLE_DEFINITION.slug,
    showcaseRunId: AI_KNOWLEDGE_ASSISTANT_SAMPLE_RUN_ID,
    notes: "Secondary created-package deep link (TB-982 / M-135); route slug unchanged for SQL seeds.",
  },
  {
    surface: "Trial onboarding wizard `trialSampleRunId` / `TRIAL_ONBOARDING_SAMPLE_RUN_ID`",
    packageSlug: "contoso-retail-sql-seed",
    showcaseRunId: TRIAL_ONBOARDING_SAMPLE_RUN_ID,
    notes:
      "Honest co-primary: live SQL-seeded Contoso retail workspace (M-107/M-134). Differs from static marketing showcase IDs by design until trial bootstrap aligns.",
  },
] as const;

export const PRIMARY_SHOWCASE_PROOF_HREF = CUSTOMER_INTAKE_CANONICAL_PROOF_HREF;

export const SECONDARY_CLAIMS_PROOF_HREF = CLAIMS_INTAKE_CANONICAL_PROOF_HREF;

export const SECONDARY_AI_KNOWLEDGE_ASSISTANT_PROOF_HREF = AI_KNOWLEDGE_ASSISTANT_CANONICAL_PROOF_HREF;

export function publicSampleHrefForGetStartedVertical(
  verticalSlug: string,
): string {
  if (verticalSlug.trim().toLowerCase() === "healthcare") {
    return SECONDARY_CLAIMS_PROOF_HREF;
  }

  return PRIMARY_SHOWCASE_PROOF_HREF;
}
