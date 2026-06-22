import { typedPayloadLookupString } from "@/lib/finding-display-from-inspect";
import { graphEvidenceHrefFromInspect, preferredGraphNodeIdForFindingDeepLink } from "@/lib/finding-inspect-graph-evidence";
import { graphTrailHrefWithOptionalNode } from "@/lib/graph-finding-deep-links";
import { normalizeEvidenceRefSnippet } from "@/lib/finding-evidence-ref-snippet";
import { policyPacksRuleHref } from "@/lib/policy-packs-deep-link";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { FindingInspectEvidence, FindingInspectPayload } from "@/types/finding-inspect";

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
  return `/reviews/${encodeURIComponent(runId.trim())}/findings/${encodeURIComponent(findingId.trim())}/inspect`;
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

export function buildFindingPolicyEvidenceCitationsFromInspect(
  runId: string,
  findingId: string,
  payload: FindingInspectPayload,
): FindingPolicyEvidenceCitationModel {
  const ruleId = resolvePolicyRuleIdFromInspect(payload);
  const ruleLabel = resolvePolicyRuleLabelFromInspect(payload, ruleId);
  const inspectHref = findingInspectHref(runId, findingId);
  const graphHref = graphEvidenceHrefFromInspect(runId, findingId, payload);
  const defaultEvidenceHref = graphHref ?? inspectHref;

  const policy =
    ruleId !== null && ruleLabel !== null
      ? {
          ruleId,
          ruleLabel,
          href: policyPacksRuleHref(ruleId),
        }
      : null;

  const evidence = payload.evidence
    .map((row) => {
      const label = findingInspectEvidenceCitationLabel(row);
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
        label,
        detail: detailParts.length > 0 ? detailParts.join(" · ") : null,
        href: defaultEvidenceHref,
      };
    })
    .filter((row) => row.label.trim().length > 0);

  return { policy, evidence };
}

export function buildFindingPolicyEvidenceCitationsFromQuickDecision(
  runId: string,
  finding: QuickDecisionFinding,
): FindingPolicyEvidenceCitationModel {
  const ruleId = nonEmptyString(finding.policyRuleId);
  const ruleLabel = ruleId;
  const inspectHref = findingInspectHref(runId, finding.findingId);
  const graphFocusId = preferredGraphNodeIdForFindingDeepLink(runId, finding.findingId);
  const graphHref =
    (finding.evidenceRefCount ?? 0) > 0 || graphFocusId !== null
      ? graphTrailHrefWithOptionalNode(runId, graphFocusId)
      : null;
  const defaultEvidenceHref = graphHref ?? inspectHref;

  const policy =
    ruleId !== null && ruleLabel !== null
      ? {
          ruleId,
          ruleLabel,
          href: policyPacksRuleHref(ruleId),
        }
      : null;

  const evidenceFromSnippets = (finding.evidenceRefSnippets ?? [])
    .map((snippet) => ({
      label: snippet,
      detail: null as string | null,
      href: defaultEvidenceHref,
    }))
    .filter((row) => row.label.trim().length > 0);

  if (evidenceFromSnippets.length > 0) {
    return { policy, evidence: evidenceFromSnippets };
  }

  const evidenceRefCount = finding.evidenceRefCount ?? 0;

  if (evidenceRefCount <= 0) {
    return { policy, evidence: [] };
  }

  return {
    policy,
    evidence: [
      {
        label: evidenceRefCount === 1 ? "1 linked evidence reference" : `${evidenceRefCount} linked evidence references`,
        detail: null,
        href: defaultEvidenceHref,
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
