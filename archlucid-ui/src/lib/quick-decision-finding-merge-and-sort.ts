import type { RunDetail } from "@/types/authority";
import type { FindingConfidenceLevel, FindingTraceConfidenceDto, RunExplanationSummary } from "@/types/explanation";
import { normalizeFindingConfidenceLevel } from "@/types/explanation";
import { resolveFindingTraceRowsFromSummary } from "@/lib/quick-decision-wire-snapshots";

import {
  extractQuickDecisionFindingsFromRunDetail,
  normalizeEvaluationConfidenceScore,
  quickDecisionFindingFromTraceRow,
  type QuickDecisionFinding,
} from "@/lib/quick-decision-finding-from-detail";

function findingTraceRowsFromSummary(summary: RunExplanationSummary | null): FindingTraceConfidenceDto[] {
  return resolveFindingTraceRowsFromSummary(summary);
}

function normalizeConfidenceLevelFromWire(raw: unknown): FindingConfidenceLevel | null {
  return normalizeFindingConfidenceLevel(
    raw as FindingConfidenceLevel | number | string | null | undefined,
  );
}

function pickPositiveEvidenceRefCount(
  a: number | null | undefined,
  b: number | null | undefined,
): number | null {
  const na = typeof a === "number" && Number.isFinite(a) && a > 0 ? Math.trunc(a) : 0;
  const nb = typeof b === "number" && Number.isFinite(b) && b > 0 ? Math.trunc(b) : 0;
  const m = Math.max(na, nb);

  return m > 0 ? m : null;
}

function mergeQuickDecisionFindingsWithExplanationTraces(
  findings: QuickDecisionFinding[],
  summary: RunExplanationSummary | null,
): QuickDecisionFinding[] {
  const rows = findingTraceRowsFromSummary(summary);

  if (rows.length === 0) {
    return findings;
  }

  const byId = new Map<string, FindingTraceConfidenceDto>();

  for (const row of rows) {
    const id = typeof row.findingId === "string" ? row.findingId.trim() : "";

    if (id.length > 0) {
      byId.set(id, row);
    }
  }

  return findings.map((f) => {
    const row = byId.get(f.findingId.trim());

    if (row === undefined) {
      return f;
    }

    const fromRowLevel = normalizeConfidenceLevelFromWire(row.confidenceLevel);
    const confidenceLevel = f.confidenceLevel ?? fromRowLevel ?? null;

    const fromRowScore = normalizeEvaluationConfidenceScore(row.evaluationConfidenceScore);
    const evaluationConfidenceScore =
      f.evaluationConfidenceScore ?? fromRowScore ?? null;

    const traceLabelFromRow =
      typeof row.traceConfidenceLabel === "string" && row.traceConfidenceLabel.trim().length > 0
        ? row.traceConfidenceLabel.trim()
        : null;
    const traceConfidenceLabel = f.traceConfidenceLabel ?? traceLabelFromRow ?? null;

    const rowErc =
      typeof row.evidenceRefCount === "number" && Number.isFinite(row.evidenceRefCount) && row.evidenceRefCount > 0
        ? Math.trunc(row.evidenceRefCount)
        : null;
    const evidenceRefCount = pickPositiveEvidenceRefCount(f.evidenceRefCount, rowErc);

    return {
      ...f,
      confidenceLevel,
      evaluationConfidenceScore,
      traceConfidenceLabel,
      evidenceRefCount,
    };
  });
}

/** True when quick-decision rows come from aggregate explanation traces, not agent `results[].findings`. */
export function isQuickDecisionDerivedFromExplanationTraces(
  detail: RunDetail,
  explanationSummary: RunExplanationSummary | null,
): boolean {
  if (extractQuickDecisionFindingsFromRunDetail(detail).length > 0) {
    return false;
  }

  return findingTraceRowsFromSummary(explanationSummary).length > 0;
}

/**
 * Prefer flattened agent `results[].findings`; when that slice is empty but the aggregate explanation lists per-finding
 * trace rows (common when run-detail findings omit ids), derive quick-decision rows from explanation.
 */
export function resolveQuickDecisionFindingsForRunDetail(
  detail: RunDetail,
  explanationSummary: RunExplanationSummary | null,
): QuickDecisionFinding[] {
  const fromDetail = extractQuickDecisionFindingsFromRunDetail(detail);

  let base: QuickDecisionFinding[];

  if (fromDetail.length > 0) {
    base = fromDetail;
  } else {
    const traces = findingTraceRowsFromSummary(explanationSummary);

    if (traces.length === 0) {
      return [];
    }

    base = [];
    let order = 0;

    for (const row of traces) {
      const mapped = quickDecisionFindingFromTraceRow(row, order);

      if (mapped === null) {
        continue;
      }

      base.push(mapped);
      order += 1;
    }
  }

  return mergeQuickDecisionFindingsWithExplanationTraces(base, explanationSummary);
}

/** Reads `iacStub` for one finding from run detail agent results (no extra HTTP when detail is already loaded). */
export function extractIacStubForFinding(detail: RunDetail, findingId: string): string | null {
  const normalizedId = findingId.trim().toLowerCase();
  const findings = extractQuickDecisionFindingsFromRunDetail(detail);
  const match = findings.find((row) => row.findingId.trim().toLowerCase() === normalizedId);

  if (match === undefined) {
    return null;
  }

  return match.iacStub ?? null;
}

/**
 * True when a finding carries no linkable proof at all (no evidence refs, no evidence snippets, no policy-rule
 * citation) — the reviewer would have to trust the AI narrative on faith. Used to surface an explicit
 * "Evidence gap" signal instead of silently omitting evidence affordances (TB-619).
 */
export function findingHasNoSourceEvidence(finding: QuickDecisionFinding): boolean {
  const hasRefCount = typeof finding.evidenceRefCount === "number" && finding.evidenceRefCount > 0;
  const hasSnippets = (finding.evidenceRefSnippets?.length ?? 0) > 0;
  const hasPolicyRule = typeof finding.policyRuleId === "string" && finding.policyRuleId.trim().length > 0;

  return !hasRefCount && !hasSnippets && !hasPolicyRule;
}

/** Highest severity first, then original finding order. Policy violations precede advisory notes. */
export function sortQuickDecisionFindings(findings: readonly QuickDecisionFinding[]): QuickDecisionFinding[] {
  return [...findings].sort((a, b) => {
    const aAdvisory = a.enforcementTier === "Advisory" ? 1 : 0;
    const bAdvisory = b.enforcementTier === "Advisory" ? 1 : 0;

    if (aAdvisory !== bAdvisory) {
      return aAdvisory - bAdvisory;
    }

    if (b.severityValue !== a.severityValue) {
      return b.severityValue - a.severityValue;
    }

    return a.findingOrder - b.findingOrder;
  });
}

export function partitionQuickDecisionFindings(findings: readonly QuickDecisionFinding[]): {
  policyViolations: QuickDecisionFinding[];
  advisoryNotes: QuickDecisionFinding[];
} {
  const policyViolations: QuickDecisionFinding[] = [];
  const advisoryNotes: QuickDecisionFinding[] = [];

  for (const finding of findings) {
    if (finding.enforcementTier === "Advisory") {
      advisoryNotes.push(finding);
    } else {
      policyViolations.push(finding);
    }
  }

  return { policyViolations, advisoryNotes };
}

/** Findings rendered as workspace cards (excludes collapsed advisory notes by default). */
export function buildWorkspaceCardRenderedFindings(
  findings: readonly QuickDecisionFinding[],
  options: {
    readonly showAdvisory: boolean;
    readonly showMuted: boolean;
  },
): QuickDecisionFinding[] {
  const sorted = sortQuickDecisionFindings(findings);
  const afterMuteFilter = options.showMuted ? sorted : sorted.filter((finding) => !finding.isMuted);
  const { policyViolations, advisoryNotes } = partitionQuickDecisionFindings(afterMuteFilter);
  const combined: QuickDecisionFinding[] = [...policyViolations];

  if (options.showAdvisory) {
    combined.push(...advisoryNotes);
  }

  return sortQuickDecisionFindings(combined);
}
