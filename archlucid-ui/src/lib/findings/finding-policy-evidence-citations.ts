import { typedPayloadLookupString } from "@/lib/findings/finding-display-from-inspect";
import { getFindingEvidenceTraceHref } from "@/lib/findings/finding-evidence-navigation";
import { preferredGraphNodeIdForFindingDeepLink } from "@/lib/findings/finding-inspect-graph-evidence";
import { normalizeEvidenceRefSnippet } from "@/lib/findings/finding-evidence-ref-snippet";
import {
  buildSourceEvidenceLinksFromEvidenceRefs,
  buildSourceEvidenceLinksFromInspectEvidence,
  defaultManifestIdForShowcaseFinding,
  parseEvidenceRefToSourceLink,
  primaryFindingEvidenceNavigationHref,
  runDetailSectionHref,
} from "@/lib/findings/finding-source-evidence-links";
import { graphTrailHrefWithOptionalNode } from "@/lib/graph-finding-deep-links";
import { policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
import { inferPolicyPackDisplayNameFromComplianceRuleKey } from "@/lib/policy/policy-pack-rule-key-prefix-catalog";
import { policyPacksEditHref, policyPacksRuleHref } from "@/lib/policy/policy-packs-deep-link";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { FindingInspectEvidence, FindingInspectPayload } from "@/types/finding-inspect";

export type FindingPolicyPackCitationLink = {
  readonly packId: string;
  readonly packName: string;
  readonly href: string;
};

export type FindingPolicyCitationLink = {
  readonly ruleId: string;
  readonly ruleLabel: string;
  readonly href: string;
};

export type FindingEvidenceCitationLink = {
  readonly label: string;
  readonly detail: string | null;
  readonly href: string;
};

export type FindingPolicyEvidenceCitationModel = {
  readonly pack: FindingPolicyPackCitationLink | null;
  readonly policy: FindingPolicyCitationLink | null;
  readonly evidence: readonly FindingEvidenceCitationLink[];
};

function nonEmptyString(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

export function findingInspectEvidenceCitationLabel(row: FindingInspectEvidence): string {
  const excerpt = row.excerpt?.trim() ?? "";

  if (excerpt.length > 0) {
    const firstClause = excerpt.split(/[.—]/)[0]?.trim() ?? excerpt;

    if (firstClause.length > 0 && firstClause.length <= 80) {
      return firstClause;
    }

    return excerpt.length > 80 ? `${excerpt.slice(0, 77)}…` : excerpt;
  }

  const artifact = row.artifactId?.trim() ?? "";

  if (artifact.length > 0) {
    return artifact.replace(/-/g, " ");
  }

  return "Cited evidence";
}

export function findingInspectHref(runId: string, findingId: string): string {
  return getFindingEvidenceTraceHref(runId, findingId);
}

export function resolvePolicyRuleIdFromInspect(payload: FindingInspectPayload): string | null {
  return (
    nonEmptyString(payload.decisionRuleId) ??
    nonEmptyString(typedPayloadLookupString(payload, "policyRuleId")) ??
    nonEmptyString(typedPayloadLookupString(payload, "PolicyRuleId"))
  );
}

export function resolvePolicyRuleLabelFromInspect(payload: FindingInspectPayload, ruleId: string | null): string | null {
  return nonEmptyString(payload.decisionRuleName) ?? ruleId;
}

export function resolvePolicyPackIdFromInspect(payload: FindingInspectPayload): string | null {
  return (
    nonEmptyString(typedPayloadLookupString(payload, "policyPackId")) ??
    nonEmptyString(typedPayloadLookupString(payload, "PolicyPackId")) ??
    nonEmptyString(typedPayloadLookupString(payload, "ruleSetId")) ??
    nonEmptyString(typedPayloadLookupString(payload, "RuleSetId"))
  );
}

export function resolvePolicyPackVersionFromInspect(payload: FindingInspectPayload): string | null {
  return (
    nonEmptyString(typedPayloadLookupString(payload, "policyPackVersion")) ??
    nonEmptyString(typedPayloadLookupString(payload, "PolicyPackVersion")) ??
    nonEmptyString(typedPayloadLookupString(payload, "ruleSetVersion")) ??
    nonEmptyString(typedPayloadLookupString(payload, "RuleSetVersion"))
  );
}

export function resolvePolicyPackNameFromInspect(
  payload: FindingInspectPayload,
  packId: string | null,
): string | null {
  const explicitName =
    nonEmptyString(typedPayloadLookupString(payload, "policyPackName")) ??
    nonEmptyString(typedPayloadLookupString(payload, "PolicyPackName"));

  if (explicitName !== null) {
    return explicitName;
  }

  if (packId === null) {
    return null;
  }

  const version = resolvePolicyPackVersionFromInspect(payload) ?? "";

  return policyPackBuyerLabel(packId, version);
}

/** First non-empty reasoning excerpt suitable for policy provenance UI. */
export function resolvePolicyTraceExcerptFromInspect(payload: FindingInspectPayload): string | null {
  const reasoningSummary = nonEmptyString(payload.reasoningSummary);

  if (reasoningSummary !== null) {
    return reasoningSummary;
  }

  const reasoningTrace = nonEmptyString(payload.reasoningTrace);

  if (reasoningTrace !== null) {
    return reasoningTrace.length > 320 ? `${reasoningTrace.slice(0, 317)}…` : reasoningTrace;
  }

  const firstEvidenceExcerpt = payload.evidence
    .map((row) => nonEmptyString(row.excerpt))
    .find((excerpt) => excerpt !== null);

  return firstEvidenceExcerpt ?? null;
}

export function buildFindingPolicyEvidenceCitationsFromInspect(
  runId: string,
  findingId: string,
  payload: FindingInspectPayload,
  manifestId: string | null = null,
): FindingPolicyEvidenceCitationModel {
  const ruleId = resolvePolicyRuleIdFromInspect(payload);
  const ruleLabel = resolvePolicyRuleLabelFromInspect(payload, ruleId);
  const packId = resolvePolicyPackIdFromInspect(payload);
  const packName = resolvePolicyPackNameFromInspect(payload, packId);
  const linkContext = { runId, findingId, manifestId };

  const pack =
    packId !== null && packName !== null
      ? {
          packId,
          packName,
          href: policyPacksEditHref(packId),
        }
      : null;

  const policy =
    ruleId !== null && ruleLabel !== null
      ? {
          ruleId,
          ruleLabel,
          href: policyPacksRuleHref(ruleId),
        }
      : null;

  const evidence = payload.evidence
    .map((row, index) => {
      const sourceLink = buildSourceEvidenceLinksFromInspectEvidence(linkContext, row, index);
      const lineRange = nonEmptyString(row.lineRange);
      const artifactId = nonEmptyString(row.artifactId);
      const detailParts: string[] = [];

      if (lineRange !== null) {
        detailParts.push(`Lines ${lineRange}`);
      }

      if (artifactId !== null) {
        detailParts.push(artifactId);
      }

      return {
        label: findingInspectEvidenceCitationLabel(row),
        detail: sourceLink.detail ?? (detailParts.length > 0 ? detailParts.join(" · ") : null),
        href: sourceLink.href,
      };
    })
    .filter((row) => row.label.trim().length > 0);

  return { pack, policy, evidence };
}

export function buildPolicyTraceabilityLinksFromRuleId(
  ruleId: string | null | undefined,
  ruleLabel?: string | null,
): Pick<FindingPolicyEvidenceCitationModel, "pack" | "policy"> {
  const normalizedRuleId = nonEmptyString(ruleId);
  const normalizedRuleLabel = nonEmptyString(ruleLabel) ?? normalizedRuleId;

  if (normalizedRuleId === null || normalizedRuleLabel === null) {
    return { pack: null, policy: null };
  }

  const policy: FindingPolicyCitationLink = {
    ruleId: normalizedRuleId,
    ruleLabel: normalizedRuleLabel,
    href: policyPacksRuleHref(normalizedRuleId),
  };

  const packName = inferPolicyPackDisplayNameFromComplianceRuleKey(normalizedRuleId);
  const pack =
    packName !== null
      ? {
          packId: normalizedRuleId,
          packName,
          href: policyPacksRuleHref(normalizedRuleId),
        }
      : null;

  return { pack, policy };
}

export function buildFindingPolicyEvidenceCitationsFromQuickDecision(
  runId: string,
  finding: QuickDecisionFinding,
): FindingPolicyEvidenceCitationModel {
  const ruleId = nonEmptyString(finding.policyRuleId);
  const ruleLabel = ruleId;
  const { pack, policy } = buildPolicyTraceabilityLinksFromRuleId(ruleId, ruleLabel);
  const manifestId = defaultManifestIdForShowcaseFinding(runId, finding.findingId);
  const linkContext = { runId, findingId: finding.findingId, manifestId };

  const evidenceFromSnippets = (finding.evidenceRefSnippets ?? [])
    .map((snippet) => {
      const parsed =
        parseEvidenceRefToSourceLink(snippet, linkContext) ??
        ({
          kind: "artifactSection" as const,
          label: snippet,
          detail: null,
          href: runDetailSectionHref(runId, "artifacts-exports"),
        });

      return {
        label: snippet,
        detail: parsed.detail,
        href: parsed.href,
      };
    })
    .filter((row) => row.label.trim().length > 0);

  if (evidenceFromSnippets.length > 0) {
    return { pack, policy, evidence: evidenceFromSnippets };
  }

  const evidenceRefCount = finding.evidenceRefCount ?? 0;

  if (evidenceRefCount <= 0) {
    return { pack, policy, evidence: [] };
  }

  const graphFocusId = preferredGraphNodeIdForFindingDeepLink(runId, finding.findingId);
  const fallbackLinks = buildSourceEvidenceLinksFromEvidenceRefs(linkContext, [`evidence:${finding.findingId}`]);
  const fallbackHref =
    primaryFindingEvidenceNavigationHref(fallbackLinks) ??
    (graphFocusId !== null
      ? graphTrailHrefWithOptionalNode(runId, graphFocusId)
      : runDetailSectionHref(runId, "manifest-summary"));

  return {
    pack,
    policy,
    evidence: [
      {
        label: evidenceRefCount === 1 ? "1 linked evidence reference" : `${evidenceRefCount} linked evidence references`,
        detail: null,
        href: fallbackHref,
      },
    ],
  };
}

export function coercePolicyRuleIdFromFindingWire(raw: unknown): string | null {
  if (raw === null || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const direct = record.policyRuleId ?? record.PolicyRuleId;

  if (typeof direct === "string") {
    return nonEmptyString(direct);
  }

  return null;
}

export function evidenceRefSnippetsFromWire(raw: unknown, limit = 3): readonly string[] {
  if (!Array.isArray(raw) || limit <= 0) {
    return [];
  }

  const out: string[] = [];

  for (const item of raw) {
    const snippet = normalizeEvidenceRefSnippet(item);

    if (snippet !== null) {
      out.push(snippet);
    }

    if (out.length >= limit) {
      break;
    }
  }

  return out;
}
