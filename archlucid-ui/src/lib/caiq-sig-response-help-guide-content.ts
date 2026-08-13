import { COMPLIANCE_JOURNEY_CANONICAL_PATH } from "@/lib/compliance-journey-evidence-copy";
import {
  CAIQ_SIG_RESPONSE_LITE_PART_HEADING,
  CAIQ_SIG_RESPONSE_SIG_PART_HEADING,
} from "@/lib/caiq-sig-response-help-presentation";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const CAIQ_SIG_RESPONSE_HELP_PAGE_TITLE = "CAIQ / SIG questionnaire responses";

export const CAIQ_SIG_RESPONSE_HELP_PAGE_SUBTITLE =
  "Pre-filled CAIQ Lite themes and SIG Core families for procurement reviewers — transpose into your buyer workbook, not a completed STAR/SIG submission.";

export const CAIQ_SIG_RESPONSE_HELP_GUIDE_TEST_ID = "help-caiq-sig-response-guide" as const;

export const CAIQ_SIG_RESPONSE_HELP_JOB_MATRIX_HEADING = "Which questionnaire section?";

export type CaiqSigResponseHelpJobMatrixRow = {
  readonly label: string;
  readonly when: string;
  readonly href?: string;
  readonly isCurrent?: boolean;
};

export function buildCaiqSigResponseHelpJobMatrix(
  liteSectionId: string,
  sigSectionId: string,
): readonly CaiqSigResponseHelpJobMatrixRow[] {
  return [
    {
      label: CAIQ_SIG_RESPONSE_LITE_PART_HEADING,
      href: `#${liteSectionId}`,
      when: "CSA CAIQ Lite themes and evidence mapping for security questionnaires",
    },
    {
      label: CAIQ_SIG_RESPONSE_SIG_PART_HEADING,
      href: `#${sigSectionId}`,
      when: "Shared Assessments SIG Core families summarized for RFP appendix drafts",
    },
    {
      label: "This questionnaire guide",
      when: "Browse posture summary and both halves on one page",
      isCurrent: true,
    },
  ];
}

export const CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTIONS = {
  openTrustCenter: {
    label: "Open Trust Center",
    href: "/trust",
    testId: "help-caiq-sig-response-primary-action",
  },
  openComplianceJourney: {
    label: "Compliance journey",
    href: COMPLIANCE_JOURNEY_CANONICAL_PATH,
    testId: "help-caiq-sig-response-compliance-journey-action",
  },
  requestDiligencePack: {
    label: "Request diligence pack",
    href: inAppHelpHref("procurement"),
    testId: "help-caiq-sig-response-request-pack-action",
  },
} as const;

export const CAIQ_SIG_RESPONSE_HELP_WORKFLOW_STEPS = [
  "Open Trust Center or the compliance journey when you need downloadable diligence materials.",
  "Use CAIQ Lite rows for CSA questionnaire themes; use SIG Core when the buyer issued a Shared Assessments workbook.",
  "Transpose posture and evidence cells into your buyer workbook — this guide does not submit STAR or SIG on your behalf.",
] as const;

export const CAIQ_SIG_RESPONSE_SIG_DEFERRED_SUMMARY =
  "Show full SIG pre-fill (family summary tables)" as const;

export const CAIQ_SIG_RESPONSE_SIG_DEFERRED_TEST_ID = "help-caiq-sig-response-sig-deferred" as const;

export type CaiqSigPreparedMarkdownHalves = {
  readonly liteMarkdown: string;
  readonly sigMarkdown: string;
};

/** Splits prepared CAIQ/SIG markdown for TB-1634 first-viewport density (CAIQ-first). */
export function splitCaiqSigPreparedMarkdown(preparedMarkdown: string): CaiqSigPreparedMarkdownHalves {
  const sigHeading = `## ${CAIQ_SIG_RESPONSE_SIG_PART_HEADING}`;
  const sigIndex = preparedMarkdown.indexOf(sigHeading);

  if (sigIndex < 0) {
    return { liteMarkdown: preparedMarkdown.trimEnd(), sigMarkdown: "" };
  }

  return {
    liteMarkdown: preparedMarkdown.slice(0, sigIndex).trimEnd(),
    sigMarkdown: preparedMarkdown.slice(sigIndex).trimStart(),
  };
}
