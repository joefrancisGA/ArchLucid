import { CLOUD_NEUTRAL_PRIMARY_COPY } from "@/lib/cloud-neutral-primary-copy";
import {
  BASELINE_SETTINGS_HELP_OVERVIEW,
  BASELINE_SETTINGS_HELP_PAGE_SUBTITLE,
} from "@/lib/baseline-settings-help-guide-content";
import {
  BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE as BASELINE_SETTINGS_HELP_EVIDENCE_CLAIM,
} from "@/lib/baseline-settings-help-evidence-copy";
import {
  DECISION_REGISTER_EMPTY_TEACHING_BODY,
  DECISION_REGISTER_EMPTY_TEACHING_HONESTY,
  DECISION_REGISTER_EMPTY_TEACHING_TITLE,
} from "@/lib/decision-register-empty-teaching";
import {
  DECISION_REGISTER_HELP_CLAIM_DISCIPLINE,
  DECISION_REGISTER_HELP_OVERVIEW,
  DECISION_REGISTER_HELP_PAGE_SUBTITLE,
} from "@/lib/decision-register-help-guide-content";
import { DECISION_REGISTER_HELP_CLAIM_DISCIPLINE as DECISION_REGISTER_HELP_EVIDENCE_CLAIM } from "@/lib/decision-register-help-evidence-copy";
import {
  FOCUSED_PILOT_MODE_COPY,
  REVIEW_SCOPE_HELP_EXPLANATION,
  REVIEW_SCOPE_WORKSPACE_DISAMBIGUATION,
} from "@/lib/focused-pilot-mode-policy-packs";
import {
  REVIEW_GUIDE_HELP_CLAIM_DISCIPLINE,
  REVIEW_GUIDE_HELP_OVERVIEW,
  REVIEW_GUIDE_HELP_PAGE_SUBTITLE,
} from "@/lib/review-guide-help-guide-content";
import { REVIEW_GUIDE_HELP_CLAIM_DISCIPLINE as REVIEW_GUIDE_HELP_EVIDENCE_CLAIM } from "@/lib/review-guide-help-evidence-copy";

/**
 * TB-2263 — Post TB-2249 baseline UX honesty guard for help/governance copy.
 * Blocks false tri-cloud peer / provider-neutral baseline claims at the default-selection layer.
 */
export const HELP_GOVERNANCE_BASELINE_BANNED_PHRASES: readonly string[] = [
  "provider-neutral quality baseline",
  "every architecture receives a provider-neutral",
  "always considered on every cloud",
  "equal depth on aws, azure, and gcp",
  "identical coverage on every cloud",
  "same rules on aws, azure, and gcp",
  "azure/aws/gcp peer framing at default",
  "equal default packs on every cloud",
] as const;

/** Scoped honesty line reused when help mentions bundled cloud baseline packs (TB-2249). */
export const BASELINE_UX_SCOPED_COVERAGE_HONESTY = CLOUD_NEUTRAL_PRIMARY_COPY.scopedCloudCoverageClaim;

export const HELP_GOVERNANCE_BASELINE_COPY_SURFACES: Readonly<Record<string, string>> = {
  reviewScopeHelpExplanation: REVIEW_SCOPE_HELP_EXPLANATION,
  reviewScopeWorkspaceDisambiguation: REVIEW_SCOPE_WORKSPACE_DISAMBIGUATION,
  focusedPilotAppliedBody: FOCUSED_PILOT_MODE_COPY.appliedCalloutBody,
  focusedPilotRecommendedDescription: FOCUSED_PILOT_MODE_COPY.choiceRecommendedDescription,
  reviewGuideOverview: REVIEW_GUIDE_HELP_OVERVIEW,
  reviewGuideSubtitle: REVIEW_GUIDE_HELP_PAGE_SUBTITLE,
  reviewGuideClaimDiscipline: REVIEW_GUIDE_HELP_CLAIM_DISCIPLINE,
  reviewGuideEvidenceClaimDiscipline: REVIEW_GUIDE_HELP_EVIDENCE_CLAIM,
  decisionRegisterOverview: DECISION_REGISTER_HELP_OVERVIEW,
  decisionRegisterSubtitle: DECISION_REGISTER_HELP_PAGE_SUBTITLE,
  decisionRegisterClaimDiscipline: DECISION_REGISTER_HELP_CLAIM_DISCIPLINE,
  decisionRegisterEvidenceClaimDiscipline: DECISION_REGISTER_HELP_EVIDENCE_CLAIM,
  decisionRegisterEmptyTeachingTitle: DECISION_REGISTER_EMPTY_TEACHING_TITLE,
  decisionRegisterEmptyTeachingBody: DECISION_REGISTER_EMPTY_TEACHING_BODY,
  decisionRegisterEmptyTeachingHonesty: DECISION_REGISTER_EMPTY_TEACHING_HONESTY,
  baselineSettingsOverview: BASELINE_SETTINGS_HELP_OVERVIEW,
  baselineSettingsSubtitle: BASELINE_SETTINGS_HELP_PAGE_SUBTITLE,
  baselineSettingsEvidenceClaimDiscipline: BASELINE_SETTINGS_HELP_EVIDENCE_CLAIM,
};

export function listHelpGovernanceBaselineCopyViolations(
  surfaces: Readonly<Record<string, string>> = HELP_GOVERNANCE_BASELINE_COPY_SURFACES,
): string[] {
  const violations: string[] = [];

  for (const [surfaceId, text] of Object.entries(surfaces)) {
    if (typeof text !== "string" || text.trim().length === 0) {
      continue;
    }

    const normalized = text.toLowerCase();

    for (const phrase of HELP_GOVERNANCE_BASELINE_BANNED_PHRASES) {
      if (normalized.includes(phrase)) {
        violations.push(`${surfaceId}: banned phrase "${phrase}"`);
      }
    }
  }

  return violations;
}
