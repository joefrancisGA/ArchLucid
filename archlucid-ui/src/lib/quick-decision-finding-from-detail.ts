import type { RunDetail } from "@/types/authority";
import type { FindingConfidenceLevel, FindingTraceConfidenceDto } from "@/types/explanation";
import { normalizeFindingConfidenceLevel } from "@/types/explanation";
import { normalizeFindingEnforcementTier, type FindingEnforcementTierKind } from "@/lib/findings/finding-enforcement-tier";
import { collectEvidenceRefSnippets } from "@/lib/findings/finding-evidence-ref-snippet";
import { coercePolicyRuleIdFromFindingWire } from "@/lib/findings/finding-policy-evidence-citations";
import type { FindingWireSnapshot } from "@/lib/quick-decision-wire-snapshots";
import {
  coerceArchitectureFindingSeverity,
  normalizeFindingHumanReviewStatus,
} from "@/lib/quick-decision-severity-labels";

/** Inputs derived only from GET run detail `results[].findings` (ArchitectureFinding). */
export type QuickDecisionFinding = {
  findingId: string;
  title: string;
  recommendation: string;
  /** Raw `FindingSeverity` enum numeric from API (higher = more severe). */
  severityValue: number;
  /** Stable order within the flattened results/findings traversal. */
  findingOrder: number;
  /** Full finding record JSON + reasoning trace for optional Staged Critic / evaluation panel. */
  aiReasoning: FindingWireSnapshot;
  /** When true, hidden from default quick-decision list until "Show muted" is enabled. */
  isMuted: boolean;
  muteReason: string | null;
  /** Coarse evaluation confidence when present on the wire or merged from explainability rows. */
  confidenceLevel?: FindingConfidenceLevel | null;
  /** Persisted 0–100-style score when serializable on the wire or explainability row. */
  evaluationConfidenceScore?: number | null;
  /** Trace completeness / label from aggregate explainability when overlaid. */
  traceConfidenceLabel?: string | null;
  /** Evidence reference count (finding `evidenceRefs` or explainability row); used for graph deep-link UX. */
  evidenceRefCount?: number | null;
  /** Optional Azure Bicep remediation snippet from agent results (`iacStub`). */
  iacStub?: string | null;
  /** Governance tier: blocking violations vs opt-in baseline guidance. */
  enforcementTier: FindingEnforcementTierKind;
  /** Normalized evidence ref excerpts for TB-385 inline display. */
  evidenceRefSnippets?: readonly string[];
  /** Persisted insight-density score when present on the wire. */
  insightDensityScore?: number | null;
  /** LLM or deterministic rationale for non-generic insight (nullable until Phase 2). */
  whyThisIsNotGeneric?: string | null;
  /** Optional policy-pack rule identifier when the finding maps to a curated pack rule. */
  policyRuleId?: string | null;
  /** Authoritative trust label from the API (`FindingTrustLabel` enum name). */
  trustLabel?: string | null;
  /** Short operator-facing reason paired with `trustLabel`. */
  trustLabelReason?: string | null;
  /** Operator-assigned remediation owner (TB-395 `Finding.AssignedToUserId`); raw user id/email, no display-name lookup. */
  assignedToUserId?: string | null;
  /** Normalized `FindingHumanReviewStatus` enum value (0=NotRequired..4=Overridden) when present on the wire. */
  humanReviewStatus?: number | null;
  /** Gate classification after ADR 0070 — DecisionGradeFinding vs ChecklistCoverage. */
  classification?: "DecisionGradeFinding" | "ChecklistCoverage" | null;
};

function normalizeConfidenceLevelFromWire(raw: unknown): FindingConfidenceLevel | null {
  return normalizeFindingConfidenceLevel(
    raw as FindingConfidenceLevel | number | string | null | undefined,
  );
}

/** Truncate persisted 0–100-style scores so detail extraction and trace overlays stay aligned. */
export function normalizeEvaluationConfidenceScore(raw: unknown): number | null {
  return typeof raw === "number" && Number.isFinite(raw) ? Math.trunc(raw) : null;
}

function severityValueFromTraceRow(row: FindingTraceConfidenceDto): number {
  const level = normalizeFindingConfidenceLevel(row.confidenceLevel);

  if (level === "Low") {
    return 2;
  }

  if (level === "Medium") {
    return 1;
  }

  if (level === "High") {
    return 0;
  }

  const score = row.evaluationConfidenceScore;

  if (typeof score === "number" && Number.isFinite(score)) {
    if (score < 0.35) {
      return 2;
    }

    if (score < 0.65) {
      return 1;
    }
  }

  return 1;
}

export function quickDecisionFindingFromTraceRow(row: FindingTraceConfidenceDto, order: number): QuickDecisionFinding | null {
  const findingId = typeof row.findingId === "string" ? row.findingId.trim() : "";

  if (findingId.length === 0) {
    return null;
  }

  const titleRaw = typeof row.findingTitle === "string" ? row.findingTitle.trim() : "";
  const title = titleRaw.length > 0 ? titleRaw : findingId;
  const recommendation = typeof row.traceConfidenceLabel === "string" ? row.traceConfidenceLabel.trim() : "";
  const ruleIdRaw = typeof row.ruleId === "string" ? row.ruleId.trim() : "";
  let wireJson: string;

  try {
    wireJson = JSON.stringify(row, null, 2);
  } catch {
    wireJson = '{"error":"finding_trace_row_not_json_serializable"}';
  }

  const evidenceRefCount =
    typeof row.evidenceRefCount === "number" && Number.isFinite(row.evidenceRefCount) && row.evidenceRefCount > 0
      ? Math.trunc(row.evidenceRefCount)
      : null;

  return {
    findingId,
    title,
    recommendation,
    severityValue: severityValueFromTraceRow(row),
    findingOrder: order,
    aiReasoning: { wireJson, reasoningTrace: recommendation },
    isMuted: false,
    muteReason: null,
    confidenceLevel: normalizeConfidenceLevelFromWire(row.confidenceLevel),
    evaluationConfidenceScore: normalizeEvaluationConfidenceScore(row.evaluationConfidenceScore),
    traceConfidenceLabel:
      typeof row.traceConfidenceLabel === "string" && row.traceConfidenceLabel.trim().length > 0
        ? row.traceConfidenceLabel.trim()
        : null,
    evidenceRefCount,
    enforcementTier: "PolicyViolation",
    policyRuleId: ruleIdRaw.length > 0 ? ruleIdRaw : null,
  };
}

/**
 * Flattens agent results findings from run detail (no extra HTTP calls).
 * Title prefers `message`, then `category`, then finding id.
 * Recommendation prefers `reasoningTrace`.
 */
export function extractQuickDecisionFindingsFromRunDetail(detail: RunDetail): QuickDecisionFinding[] {
  const raw = detail as Record<string, unknown>;
  const results = raw.results;

  if (!Array.isArray(results)) {
    return [];
  }

  let order = 0;
  const out: QuickDecisionFinding[] = [];

  for (const r of results) {
    if (r === null || typeof r !== "object") {
      continue;
    }

    const findings = (r as Record<string, unknown>).findings;

    if (!Array.isArray(findings)) {
      continue;
    }

    for (const f of findings) {
      if (f === null || typeof f !== "object") {
        continue;
      }

      const fr = f as Record<string, unknown>;
      const findingIdRaw =
        typeof fr.findingId === "string"
          ? fr.findingId.trim()
          : typeof fr.id === "string"
            ? fr.id.trim()
            : "";

      if (findingIdRaw.length === 0) {
        continue;
      }

      const findingId = findingIdRaw;

      const message = typeof fr.message === "string" ? fr.message.trim() : "";
      const category = typeof fr.category === "string" ? fr.category.trim() : "";
      const title =
        message.length > 0 ? message : category.length > 0 ? category : findingId;
      const reasoning =
        typeof fr.reasoningTrace === "string" && fr.reasoningTrace.trim().length > 0
          ? fr.reasoningTrace.trim()
          : "";

      let wireJson: string;

      try {
        wireJson = JSON.stringify(fr, null, 2);
      } catch {
        wireJson = '{"error":"finding_payload_not_json_serializable"}';
      }

      const severityValue = coerceArchitectureFindingSeverity(fr.severity);

      const isMuted = fr.isMuted === true;

      const muteReasonRaw = fr.muteReason;

      const muteReason =
        typeof muteReasonRaw === "string" && muteReasonRaw.trim().length > 0 ? muteReasonRaw.trim() : null;

      const evidenceRefsRaw = fr.evidenceRefs;
      let evidenceRefCount: number | null = null;

      if (Array.isArray(evidenceRefsRaw)) {
        const n = evidenceRefsRaw.filter((x) => typeof x === "string" && String(x).trim().length > 0).length;

        if (n > 0) {
          evidenceRefCount = n;
        }
      }

      const evaluationRaw = fr.evaluationConfidenceScore;
      const evaluationConfidenceScore = normalizeEvaluationConfidenceScore(evaluationRaw);

      const confidenceLevel = normalizeConfidenceLevelFromWire(fr.confidenceLevel);

      const iacStubRaw = fr.iacStub;
      const iacStub =
        typeof iacStubRaw === "string" && iacStubRaw.trim().length > 0 ? iacStubRaw.trim() : null;

      const enforcementTier: FindingEnforcementTierKind = normalizeFindingEnforcementTier(fr.enforcementTier);

      const insightDensityRaw = fr.insightDensityScore;
      const insightDensityScore =
        typeof insightDensityRaw === "number" && Number.isFinite(insightDensityRaw)
          ? Math.trunc(insightDensityRaw)
          : null;

      const whyRaw = fr.whyThisIsNotGeneric;
      const whyThisIsNotGeneric =
        typeof whyRaw === "string" && whyRaw.trim().length > 0 ? whyRaw.trim() : null;

      const policyRuleId = coercePolicyRuleIdFromFindingWire(fr);

      const trustLabelRaw = fr.trustLabel;
      const trustLabel =
        typeof trustLabelRaw === "string" && trustLabelRaw.trim().length > 0 ? trustLabelRaw.trim() : null;

      const trustLabelReasonRaw = fr.trustLabelReason;
      const trustLabelReason =
        typeof trustLabelReasonRaw === "string" && trustLabelReasonRaw.trim().length > 0
          ? trustLabelReasonRaw.trim()
          : null;

      const assignedToUserIdRaw = fr.assignedToUserId;
      const assignedToUserId =
        typeof assignedToUserIdRaw === "string" && assignedToUserIdRaw.trim().length > 0
          ? assignedToUserIdRaw.trim()
          : null;

      const humanReviewStatus = normalizeFindingHumanReviewStatus(fr.humanReviewStatus);

      const classificationRaw = fr.classification;
      const classification =
        classificationRaw === "DecisionGradeFinding" || classificationRaw === "ChecklistCoverage"
          ? classificationRaw
          : null;

      out.push({
        findingId,
        title,
        recommendation: reasoning,
        severityValue,
        findingOrder: order++,
        aiReasoning: { wireJson, reasoningTrace: reasoning },
        isMuted,
        muteReason,
        confidenceLevel,
        evaluationConfidenceScore,
        traceConfidenceLabel: null,
        evidenceRefCount,
        evidenceRefSnippets: collectEvidenceRefSnippets(evidenceRefsRaw),
        iacStub,
        enforcementTier,
        insightDensityScore,
        whyThisIsNotGeneric,
        policyRuleId,
        trustLabel,
        trustLabelReason,
        assignedToUserId,
        humanReviewStatus,
        classification,
      });
    }
  }

  return out;
}
