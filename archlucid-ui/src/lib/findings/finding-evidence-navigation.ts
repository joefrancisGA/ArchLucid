import { governanceFindingInspectHref } from "@/components/governance/findings/governance-findings-navigation";
import { buildGovernanceFindingsQueueHref } from "@/lib/metric-count-presentation";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { resolveWorkingFindingsInstrumentHref } from "@/lib/resolve-working-findings-instrument-href";

/** Canonical App Router segment for finding evidence trace pages. */
export const FINDING_EVIDENCE_TRACE_SEGMENT = "evidence-trace";

/** Retired URL segment — no redirect shim. */
export const FINDING_EVIDENCE_TRACE_LEGACY_SEGMENT = "inspect";

export const EVIDENCE_TRACE_PAGE_TITLE = "Evidence Trace";

export const EVIDENCE_TRACE_PAGE_SUBTITLE =
  "Inspect the policy, evidence, reasoning, audit linkage, and approval record supporting this finding.";

/** Finding detail page — parent surface of the evidence trace drill-down. */
export function getFindingDetailHref(
  runId: string,
  findingId: string,
  findingsQueueRunId?: string | null,
): string {
  const encRun = encodeURIComponent(runId.trim());
  const encFinding = encodeURIComponent(findingId.trim());
  const base = `/architecture/reviews/${encRun}/findings/${encFinding}`;
  const queueRunId = (findingsQueueRunId ?? "").trim();

  if (queueRunId.length === 0) {
    return base;
  }

  return `${base}?runId=${encodeURIComponent(queueRunId)}`;
}

export type ResolveFindingsQueueNavHrefInput = {
  readonly findingsQueueRunId?: string | null;
  readonly architectureId?: string | null;
  readonly isWorkingMode?: boolean;
};

/** Back navigation from finding detail or evidence trace to the scoped findings instrument. */
export function resolveFindingsQueueNavHref(
  input?: string | null | ResolveFindingsQueueNavHrefInput,
): string {
  const normalizedInput: ResolveFindingsQueueNavHrefInput =
    typeof input === "string" || input === null || input === undefined
      ? { findingsQueueRunId: input }
      : input;
  const queueRunId = (normalizedInput.findingsQueueRunId ?? "").trim();
  const architectureId = normalizedInput.architectureId?.trim() ?? "";
  const isWorkingMode = normalizedInput.isWorkingMode === true;

  if (isWorkingMode && architectureId.length > 0) {
    return resolveWorkingFindingsInstrumentHref({
      architectureId,
      runId: queueRunId,
      filter: "all",
      isWorkingMode: true,
    });
  }

  if (queueRunId.length === 0) {
    return GOVERNANCE_FINDINGS_PATH;
  }

  return buildGovernanceFindingsQueueHref({ runId: queueRunId, filter: "all" });
}

/** Buyer-facing drill-down into the provenance chain for a finding (#7). */
export function getFindingEvidenceTraceHref(
  runId: string,
  findingId: string,
  findingsQueueRunId?: string | null,
): string {
  const encRun = encodeURIComponent(runId.trim());
  const encFinding = encodeURIComponent(findingId.trim());
  const base = `/architecture/reviews/${encRun}/findings/${encFinding}/${FINDING_EVIDENCE_TRACE_SEGMENT}`;
  const queueRunId = (findingsQueueRunId ?? "").trim();

  if (queueRunId.length === 0) {
    return base;
  }

  return `${base}?runId=${encodeURIComponent(queueRunId)}`;
}

/** In-page anchor for the disposition workflow on the evidence trace surface. */
export const FINDING_GOVERNANCE_DISPOSITION_HASH = "governance-disposition-heading";

/** Deep link to record disposition on the evidence trace governance panel. */
export function getFindingGovernanceDispositionHref(runId: string, findingId: string): string {
  return `${getFindingEvidenceTraceHref(runId, findingId)}#${FINDING_GOVERNANCE_DISPOSITION_HASH}`;
}

export type QuickDecisionFindingNavOptions = {
  readonly architectureId?: string | null;
  readonly isWorkingMode?: boolean;
};

/** IP-005 — quick-decision Open finding stays on nested focusedFinding when architecture is known. */
export function resolveQuickDecisionFindingInspectHref(
  runId: string,
  findingId: string,
  options?: QuickDecisionFindingNavOptions,
): string {
  const architectureId = options?.architectureId?.trim() ?? "";

  if (options?.isWorkingMode === true && architectureId.length > 0) {
    return governanceFindingInspectHref(runId, findingId, {
      architectureId,
      isWorkingMode: true,
    });
  }

  return getFindingDetailHref(runId, findingId);
}

/** IP-005 — disposition CTA lands on the inhabited finding card when architecture is known. */
export function resolveQuickDecisionFindingDispositionHref(
  runId: string,
  findingId: string,
  options?: QuickDecisionFindingNavOptions,
): string {
  const architectureId = options?.architectureId?.trim() ?? "";

  if (options?.isWorkingMode === true && architectureId.length > 0) {
    return resolveQuickDecisionFindingInspectHref(runId, findingId, options);
  }

  return getFindingGovernanceDispositionHref(runId, findingId);
}

/** @deprecated Prefer {@link getFindingEvidenceTraceHref}. */
export function getFindingEvidenceInspectHref(runId: string, findingId: string): string {
  return getFindingEvidenceTraceHref(runId, findingId);
}
