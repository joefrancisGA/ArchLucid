import type { RunDetail } from "@/types/authority";
import type { FindingConfidenceLevel, FindingTraceConfidenceDto, RunExplanationSummary } from "@/types/explanation";
import { normalizeFindingConfidenceLevel } from "@/types/explanation";

/**
 * Persisted architecture finding wire snapshot for "AI reasoning" deep-dive UI.
 * Extends automatically when the API adds Staged Critic / evaluation fields — payload is full JSON.
 */
export type FindingWireSnapshot = {
  /** Pretty-printed `ArchitectureFinding` (or superset) as returned on the run detail wire. */
  wireJson: string;
  reasoningTrace: string;
};

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
};

function normalizeConfidenceLevelFromWire(raw: unknown): FindingConfidenceLevel | null {
  return normalizeFindingConfidenceLevel(
    raw as FindingConfidenceLevel | number | string | null | undefined,
  );
}

export function firstRecommendationSentence(text: string): string {
  const t = text.trim();

  if (t.length === 0) {
    return "";
  }

  const match = /^[\s\S]*?[.!?](?=\s|$)/.exec(t);

  if (match !== null) {
    return match[0].trim();
  }

  return t;
}

export function severityBadgeLabel(severityValue: number): string {
  switch (severityValue) {
    case 3:
      return "Critical";
    case 2:
      return "High";
    case 1:
      return "Medium";
    case 0:
    default:
      return "Info";
  }
}

function normalizedSeverity(severityValue: number): number {
  if (!Number.isFinite(severityValue)) {
    return 0;
  }

  const n = Math.trunc(severityValue);

  if (n < 0) {
    return 0;
  }

  if (n > 3) {
    return 3;
  }

  return n;
}

function coerceArchitectureFindingSeverity(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return normalizedSeverity(raw);
  }

  if (typeof raw === "string") {
    const parsed = Number.parseInt(raw, 10);

    if (!Number.isNaN(parsed)) {
      return normalizedSeverity(parsed);
    }
  }

  return 0;
}

function findingTraceRowsFromSummary(summary: RunExplanationSummary | null): FindingTraceConfidenceDto[] {
  if (summary === null) {
    return [];
  }

  const top = summary.findingTraceConfidences;
  const nested = summary.explanation?.findingTraceConfidences;

  if (Array.isArray(top) && top.length > 0) {
    return top;
  }

  if (Array.isArray(nested) && nested.length > 0) {
    return nested;
  }

  return [];
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

function quickDecisionFindingFromTraceRow(row: FindingTraceConfidenceDto, order: number): QuickDecisionFinding | null {
  const findingId = typeof row.findingId === "string" ? row.findingId.trim() : "";

  if (findingId.length === 0) {
    return null;
  }

  const titleRaw = typeof row.findingTitle === "string" ? row.findingTitle.trim() : "";
  const title = titleRaw.length > 0 ? titleRaw : findingId;
  const recommendation = typeof row.traceConfidenceLabel === "string" ? row.traceConfidenceLabel.trim() : "";
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
    evaluationConfidenceScore:
      typeof row.evaluationConfidenceScore === "number" && Number.isFinite(row.evaluationConfidenceScore)
        ? row.evaluationConfidenceScore
        : null,
    traceConfidenceLabel:
      typeof row.traceConfidenceLabel === "string" && row.traceConfidenceLabel.trim().length > 0
        ? row.traceConfidenceLabel.trim()
        : null,
    evidenceRefCount,
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
      const evaluationConfidenceScore =
        typeof evaluationRaw === "number" && Number.isFinite(evaluationRaw) ? Math.trunc(evaluationRaw) : null;

      const confidenceLevel = normalizeConfidenceLevelFromWire(fr.confidenceLevel);

      const iacStubRaw = fr.iacStub;
      const iacStub =
        typeof iacStubRaw === "string" && iacStubRaw.trim().length > 0 ? iacStubRaw.trim() : null;

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
        iacStub,
      });
    }
  }

  return out;
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

    const fromRowScore =
      typeof row.evaluationConfidenceScore === "number" && Number.isFinite(row.evaluationConfidenceScore)
        ? row.evaluationConfidenceScore
        : null;
    const evaluationConfidenceScore = f.evaluationConfidenceScore ?? fromRowScore ?? null;

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

/** Map of finding id → wire snapshot for any row that lists findings (e.g. explainability table). */
export function buildFindingWireSnapshotsByFindingId(detail: RunDetail): Record<string, FindingWireSnapshot> {
  const extracted = extractQuickDecisionFindingsFromRunDetail(detail);
  const record: Record<string, FindingWireSnapshot> = {};

  for (const row of extracted) {
    record[row.findingId] = row.aiReasoning;
  }

  return record;
}

/** Wire snapshots from run detail findings, extended when quick-decision rows are synthesized from explanation traces. */
export function buildFindingWireSnapshotsForRunDetail(
  detail: RunDetail,
  explanationSummary: RunExplanationSummary | null,
): Record<string, FindingWireSnapshot> {
  const record = buildFindingWireSnapshotsByFindingId(detail);
  const resolved = resolveQuickDecisionFindingsForRunDetail(detail, explanationSummary);

  for (const row of resolved) {
    if (record[row.findingId] === undefined) {
      record[row.findingId] = row.aiReasoning;
    }
  }

  return record;
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

/** Highest severity first, then original finding order. */
export function sortQuickDecisionFindings(findings: readonly QuickDecisionFinding[]): QuickDecisionFinding[] {
  return [...findings].sort((a, b) => {
    if (b.severityValue !== a.severityValue) {
      return b.severityValue - a.severityValue;
    }

    return a.findingOrder - b.findingOrder;
  });
}
