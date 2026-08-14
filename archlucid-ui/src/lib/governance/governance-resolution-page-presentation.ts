import {
  getShowcaseEvidenceTrailHref,
  getShowcaseManifestHref,
} from "@/lib/buyer/buyer-safe-review-navigation";
import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import type { GovernanceApprovalProvenance } from "@/lib/governance/governance-approval-provenance";
import { getActiveSampleScenario } from "@/lib/samples/registry";
import { tryStaticDemoGovernanceApprovalRequests } from "@/lib/operator/operator-static-demo";
import { formatInstantForBuyerGovernance } from "@/lib/locale-datetime";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { StandardsRulesContributingPolicyPack } from "@/lib/standards-rules-rows";
import type { EffectiveGovernanceResolutionResult } from "@/types/governance-resolution";

export type StandardsRulesGovernanceBannerHrefs = {
  readonly sealedRecordHref: string;
  readonly evidenceTrailHref: string;
  readonly auditTrailHref: string;
};

export type StandardsRulesGovernanceBannerModel = {
  readonly subjectLabel: string;
  readonly provenance: GovernanceApprovalProvenance;
  readonly hrefs: StandardsRulesGovernanceBannerHrefs;
};

export type StandardsRulesReviewContextModel = {
  readonly reviewName: string;
  readonly scopeLabel: string;
  readonly resolvedAtLabel: string;
  readonly contributingPolicyPacks: readonly StandardsRulesContributingPolicyPack[];
  readonly resolutionSummary: string;
};

function buildScopeLabel(_data: EffectiveGovernanceResolutionResult | null): string {
  // Resolution payloads carry workspace/project ids only; buyer-facing scope uses the workspace label.
  return getActiveSampleScenario().workspaceLabel;
}

function resolveShowcaseApprovalProvenance(): GovernanceApprovalProvenance {
  const requests = tryStaticDemoGovernanceApprovalRequests(SHOWCASE_STATIC_DEMO_RUN_ID);
  const scenario = getActiveSampleScenario();

  if (requests !== null && requests.length > 0) {
    const approval = requests[0]!;
    const approver = (approval.reviewedBy ?? "").trim();
    const approvedAt = (approval.reviewedUtc ?? "").trim();
    const recordId = (approval.approvalRequestId ?? "").trim();

    if (approver.length > 0 && approvedAt.length > 0 && recordId.length > 0) {
      return {
        approverLabel: approver,
        approvedAtUtc: approvedAt,
        scopeLabel: scenario.workspaceLabel,
        recordId,
      };
    }
  }

  return {
    approverLabel: "Jordan Lee",
    approvedAtUtc: "2026-01-14T22:05:00.000Z",
    scopeLabel: scenario.workspaceLabel,
    recordId: "claims-intake-approval-001",
  };
}

export function buildStandardsRulesGovernanceBannerHrefs(
  useShowcaseFallback: boolean,
): StandardsRulesGovernanceBannerHrefs {
  if (useShowcaseFallback) {
    return {
      sealedRecordHref: getShowcaseManifestHref(),
      evidenceTrailHref: getShowcaseEvidenceTrailHref(),
      auditTrailHref: auditTrailNavHref(SHOWCASE_STATIC_DEMO_RUN_ID),
    };
  }

  return {
    sealedRecordHref: getShowcaseManifestHref(),
    evidenceTrailHref: getShowcaseEvidenceTrailHref(),
    auditTrailHref: auditTrailNavHref(null),
  };
}

export function buildStandardsRulesGovernanceBannerModel(input: {
  readonly data: EffectiveGovernanceResolutionResult | null;
  readonly useShowcaseFallback: boolean;
}): StandardsRulesGovernanceBannerModel | null {
  if (!input.useShowcaseFallback) {
    return null;
  }

  const scenario = getActiveSampleScenario();

  return {
    subjectLabel: scenario.buyerReviewTitle,
    provenance: resolveShowcaseApprovalProvenance(),
    hrefs: buildStandardsRulesGovernanceBannerHrefs(input.useShowcaseFallback),
  };
}

function buildResolutionSummary(data: EffectiveGovernanceResolutionResult | null): string {
  const decisionReasons = (data?.decisions ?? [])
    .map((decision) => decision.resolutionReason.trim())
    .filter((reason) => reason.length > 0);

  if (decisionReasons.length > 0) {
    return decisionReasons[0]!;
  }

  const notes = (data?.notes ?? []).map((note) => note.trim()).filter((note) => note.length > 0);

  if (notes.length > 0) {
    return notes[0]!;
  }

  return "Higher-precedence policy packs at project, workspace, and tenant scope were merged to produce the enforced rule set shown below.";
}

export function buildStandardsRulesReviewContextModel(input: {
  readonly data: EffectiveGovernanceResolutionResult | null;
  readonly contributingPolicyPacks: readonly StandardsRulesContributingPolicyPack[];
  readonly useShowcaseFallback: boolean;
}): StandardsRulesReviewContextModel {
  const scenario = getActiveSampleScenario();
  const provenance = resolveShowcaseApprovalProvenance();
  const resolvedAtUtc = provenance?.approvedAtUtc ?? "2026-01-14T22:05:00.000Z";

  return {
    reviewName: scenario.buyerReviewTitle,
    scopeLabel: buildScopeLabel(input.data),
    resolvedAtLabel: formatInstantForBuyerGovernance(resolvedAtUtc),
    contributingPolicyPacks: input.contributingPolicyPacks,
    resolutionSummary: buildResolutionSummary(input.data),
  };
}
