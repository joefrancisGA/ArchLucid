import type {
  HelpMarkdownTopicContext,
  HelpMarkdownTopicRuleSet,
} from "@/lib/help-markdown-presentation-pipeline";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

import {
  alignCaiqSigAssuranceHonesty,
  softenEvidenceIntakeHelpPresentation,
  stripAcceleratorChooserContributorLeakage,
  stripAcceleratorChooserContributorSections,
  stripAcceleratorChooserIntroAndTable,
  stripAzureBoardsContributorLeakage,
  stripCaiqSigContributorLeakage,
  stripCliUsageContributorLeakage,
  stripCliUsageContributorSections,
  stripConfigurationReferenceContributorLeakage,
  stripConfigurationReferenceContributorSections,
  stripDeveloperTroubleshootingContributorLeakage,
  stripDpaTemplateContributorLeakage,
  stripEnterpriseOnboardingContributorLeakage,
  stripEnterpriseOnboardingContributorSections,
  stripEnterpriseOnboardingQuickLinksBlock,
  stripEvaluatorWorkbookContributorLeakage,
  stripEvidenceIntakeStructuredUiSections,
  stripEvidenceTrailStructuredUiSections,
  stripExecutiveSummaryContributorLeakage,
  stripExecutiveSummaryPilotRoiMeasurementLeakage,
  stripExecutiveSummarySponsorBriefLeakage,
  stripFirstReviewEvidenceChecklistContributorLeakage,
  stripFirstReviewEvidenceChecklistContributorSections,
  stripFirstValue20ContributorLeakage,
  stripGovernanceApiContractsContributorLeakage,
  stripGovernanceApiContractsContributorSections,
  stripPathChooserContributorLeakage,
  stripPathChooserStructuredUiSections,
  stripPilotFeedbackContributorLeakage,
  stripPolicyPackDeltaContributorLeakage,
  stripPriorManifestRetrievalContributorLeakage,
  stripProcurementContributorLeakage,
  stripRepeatReviewLoopContributorLeakage,
  stripRepeatReviewLoopContributorSections,
  stripSoc2SelfAssessmentContributorLeakage,
  alignSubprocessorsRegisterProductLanguage,
  stripSubprocessorsContributorLeakage,
  stripTrustCenterContributorLeakage
} from "./contributor-leakage";

function matchesSourceDoc(fileName: string): (context: HelpMarkdownTopicContext) => boolean {
  return (context) => context.normalizedSourcePath.includes(fileName);
}

function matchesSlug(slug: string): (context: HelpMarkdownTopicContext) => boolean {
  return (context) => context.helpTopicSlug === slug;
}

function matchesEither(
  ...predicates: ReadonlyArray<(context: HelpMarkdownTopicContext) => boolean>
): (context: HelpMarkdownTopicContext) => boolean {
  return (context) => predicates.some((predicate) => predicate(context));
}

function matchesBoth(
  ...predicates: ReadonlyArray<(context: HelpMarkdownTopicContext) => boolean>
): (context: HelpMarkdownTopicContext) => boolean {
  return (context) => predicates.every((predicate) => predicate(context));
}

/** Topics whose source doc drives both a section strip and a leakage strip stage. */
const IS_CONFIGURATION_REFERENCE = matchesSourceDoc("configuration_reference.md");
const IS_FIRST_REVIEW_EVIDENCE_CHECKLIST = matchesEither(
  matchesSlug("first-review"),
  matchesSourceDoc("first_run_evidence_checklist.md"),
);
const IS_CLI_USAGE = matchesEither(matchesSlug("cli-usage"), matchesSourceDoc("cli_usage.md"));
const IS_ENTERPRISE_ONBOARDING = matchesSourceDoc("hosted_enterprise_onboarding_checklist.md");
const IS_GOVERNANCE_API_CONTRACTS = matchesSourceDoc("api_contracts.md");
const IS_REPEAT_REVIEW_LOOP = matchesSourceDoc("repeat_review_loop.md");
const IS_ACCELERATOR_CHOOSER = matchesEither(
  matchesSourceDoc("accelerator_chooser.md"),
  matchesSlug("accelerator-chooser"),
);

/**
 *  Runbook `.md` links are retargeted to `/help` before the generic link rewrite drops them
 *  (TB-1346), so this stage runs ahead of the section strips.
 */
export const HELP_MARKDOWN_SOURCE_PRESTAGE_RULE_SETS: readonly HelpMarkdownTopicRuleSet[] = [
  {
    id: "evaluator-workbook",
    matches: matchesSourceDoc("evaluator_workbook.md"),
    rules: [stripEvaluatorWorkbookContributorLeakage],
  },
];

/** Contributor-only sections removed before doc links are rewritten. First match wins. */
export const HELP_MARKDOWN_CONTRIBUTOR_SECTION_RULE_SETS: readonly HelpMarkdownTopicRuleSet[] = [
  {
    id: "configuration-reference",
    matches: IS_CONFIGURATION_REFERENCE,
    rules: [stripConfigurationReferenceContributorSections],
  },
  {
    id: "first-review-evidence-checklist",
    matches: IS_FIRST_REVIEW_EVIDENCE_CHECKLIST,
    rules: [stripFirstReviewEvidenceChecklistContributorSections],
  },
  {
    id: "enterprise-onboarding",
    matches: IS_ENTERPRISE_ONBOARDING,
    rules: [stripEnterpriseOnboardingQuickLinksBlock, stripEnterpriseOnboardingContributorSections],
  },
  {
    id: "governance-api-contracts",
    matches: IS_GOVERNANCE_API_CONTRACTS,
    rules: [stripGovernanceApiContractsContributorSections],
  },
  {
    id: "repeat-review-loop",
    matches: IS_REPEAT_REVIEW_LOOP,
    rules: [stripRepeatReviewLoopContributorSections],
  },
  {
    id: "accelerator-chooser",
    matches: IS_ACCELERATOR_CHOOSER,
    rules: [stripAcceleratorChooserContributorSections],
  },
  {
    id: "cli-usage",
    matches: IS_CLI_USAGE,
    rules: [stripCliUsageContributorSections],
  },
];

/**
 *  Audience-specific leakage strips applied after link rewriting. First match wins, so a topic must
 *  not receive procurement or configuration rewrites meant for an unrelated document.
 */
export const HELP_MARKDOWN_AUDIENCE_RULE_SETS: readonly HelpMarkdownTopicRuleSet[] = [
  {
    id: "procurement-packet",
    matches: matchesSourceDoc("buyer_security_procurement_packet.md"),
    rules: [stripProcurementContributorLeakage],
  },
  {
    id: "configuration-reference",
    matches: IS_CONFIGURATION_REFERENCE,
    rules: [stripConfigurationReferenceContributorLeakage],
  },
  {
    id: "first-review-evidence-checklist",
    matches: IS_FIRST_REVIEW_EVIDENCE_CHECKLIST,
    rules: [stripFirstReviewEvidenceChecklistContributorLeakage],
  },
  {
    id: "engineering-troubleshooting",
    matches: matchesSlug("engineering-troubleshooting"),
    rules: [stripDeveloperTroubleshootingContributorLeakage],
  },
  {
    id: "cli-usage",
    matches: IS_CLI_USAGE,
    rules: [stripCliUsageContributorLeakage],
  },
  {
    id: "enterprise-onboarding",
    matches: IS_ENTERPRISE_ONBOARDING,
    rules: [stripEnterpriseOnboardingContributorLeakage],
  },
  {
    id: "governance-api-contracts",
    matches: IS_GOVERNANCE_API_CONTRACTS,
    rules: [stripGovernanceApiContractsContributorLeakage],
  },
  {
    id: "repeat-review-loop",
    matches: IS_REPEAT_REVIEW_LOOP,
    rules: [stripRepeatReviewLoopContributorLeakage],
  },
  {
    id: "accelerator-chooser",
    matches: IS_ACCELERATOR_CHOOSER,
    rules: [stripAcceleratorChooserContributorLeakage, stripAcceleratorChooserIntroAndTable],
  },
  {
    id: "azure-boards-integration",
    matches: matchesSourceDoc("azure_boards_integration.md"),
    rules: [stripAzureBoardsContributorLeakage],
  },
  {
    id: "caiq-sig-response",
    matches: matchesEither(matchesSourceDoc("caiq_lite_2026.md"), matchesSourceDoc("sig_core_2026.md")),
    rules: [stripCaiqSigContributorLeakage, alignCaiqSigAssuranceHonesty],
  },
  {
    id: "dpa-template",
    matches: matchesSourceDoc("dpa_template.md"),
    rules: [stripDpaTemplateContributorLeakage],
  },
  {
    id: "subprocessors",
    matches: matchesBoth(matchesSlug("subprocessors"), matchesSourceDoc("subprocessors.md")),
    rules: [stripSubprocessorsContributorLeakage, alignSubprocessorsRegisterProductLanguage],
  },
  {
    id: "executive-summary-faq",
    matches: matchesBoth(matchesSlug("executive-summary"), matchesSourceDoc("customer-facing/faq.md")),
    rules: [stripExecutiveSummaryContributorLeakage],
  },
  {
    id: "first-value-20-minutes",
    matches: matchesBoth(
      matchesSlug("first-value-20-minutes"),
      matchesSourceDoc("first_pilot_operator_path.md"),
    ),
    rules: [stripFirstValue20ContributorLeakage],
  },
  {
    id: "evidence-intake",
    matches: matchesBoth(
      matchesSlug("evidence-intake"),
      matchesSourceDoc("evidence_intake_operator_guide.md"),
    ),
    rules: [softenEvidenceIntakeHelpPresentation, stripEvidenceIntakeStructuredUiSections],
  },
  {
    // Never matches: the compared file name is upper-case while normalizedSourcePath is lower-cased.
    // Preserved verbatim so this refactor does not change rendered output; see stripEvidenceTrailStructuredUiSections.
    id: "evidence-trail",
    matches: matchesBoth(
      matchesSlug("evidence-trail"),
      matchesSourceDoc("EVIDENCE_TRAIL_OPERATOR_GUIDE.md"),
    ),
    rules: [stripEvidenceTrailStructuredUiSections],
  },
  {
    id: "choose-your-next-step",
    matches: matchesBoth(matchesSlug("choose-your-next-step"), matchesSourceDoc("buyer_orientation_one_screen.md")),
    rules: [stripPathChooserContributorLeakage, stripPathChooserStructuredUiSections],
  },
  {
    id: "pilot-feedback",
    matches: matchesBoth(matchesSlug("pilot-feedback"), matchesSourceDoc("product_learning.md")),
    rules: [stripPilotFeedbackContributorLeakage],
  },
  {
    id: "policy-pack-delta-demo",
    matches: matchesBoth(
      matchesSlug("policy-pack-delta-demo"),
      matchesSourceDoc("policy_pack_delta_demo_script.md"),
    ),
    rules: [stripPolicyPackDeltaContributorLeakage],
  },
  {
    id: "prior-manifest-retrieval",
    matches: matchesBoth(
      matchesSlug("prior-manifest-retrieval"),
      matchesSourceDoc("prior_manifest_retrieval_guide.md"),
    ),
    rules: [stripPriorManifestRetrievalContributorLeakage],
  },
  {
    // The product-overview alias normalizes to executive-summary before render (TB-1739).
    id: "executive-summary-sponsor-brief",
    matches: matchesSlug("executive-summary"),
    rules: [
      stripExecutiveSummarySponsorBriefLeakage,
      stripExecutiveSummaryPilotRoiMeasurementLeakage,
    ],
  },
  {
    id: "soc2-self-assessment",
    matches: matchesBoth(
      matchesSlug("soc2-self-assessment"),
      matchesSourceDoc("soc2_self_assessment_2026.md"),
    ),
    rules: [stripSoc2SelfAssessmentContributorLeakage],
  },
  {
    id: "security-trust-trust-center",
    matches: matchesBoth(matchesSlug("security-trust"), matchesSourceDoc("trust_center.md")),
    rules: [stripTrustCenterContributorLeakage],
  },
];

/** Rule-set registries exposed for the drift test that pins stage order and topic coverage. */
export const HELP_MARKDOWN_TOPIC_RULE_STAGES = {
  sourcePrestage: HELP_MARKDOWN_SOURCE_PRESTAGE_RULE_SETS,
  contributorSections: HELP_MARKDOWN_CONTRIBUTOR_SECTION_RULE_SETS,
  audience: HELP_MARKDOWN_AUDIENCE_RULE_SETS,
} as const;

/** Title duplicated by an in-page section anchor is dropped so the body does not repeat the H1. */
export function resolveDuplicateSectionTitles(helpTopicSlug: string | undefined): readonly string[] | undefined {
  const registryEntry = helpTopicSlug !== undefined ? getProductDocumentationEntry(helpTopicSlug) : null;

  if (
    registryEntry === null ||
    registryEntry.sectionAnchors === undefined ||
    registryEntry.sectionAnchors.length === 0
  ) {
    return undefined;
  }

  return [registryEntry.title];
}

