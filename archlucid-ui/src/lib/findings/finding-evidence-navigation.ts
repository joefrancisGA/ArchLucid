import { governanceFindingInspectHref } from "@/components/governance/findings/governance-findings-navigation";
import { buildReviewWorkspaceRouteHref } from "@/lib/architecture/review-workspace-route";
import { buildGovernanceFindingsQueueHref } from "@/lib/metric-count-presentation";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { resolveWorkingFindingsInstrumentHref } from "@/lib/resolve-working-findings-instrument-href";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";
import { resolveFirstReviewSpineOpenGateSectionId } from "@/lib/reviews/first-review-spine-band";

/** Canonical App Router segment for finding evidence trace pages. */
export const FINDING_EVIDENCE_TRACE_SEGMENT = "evidence-trace";

/** Retired URL segment — no redirect shim. */
export const FINDING_EVIDENCE_TRACE_LEGACY_SEGMENT = "inspect";

export const EVIDENCE_TRACE_PAGE_TITLE = "Evidence Trace";

export const EVIDENCE_TRACE_PAGE_SUBTITLE =
  "Inspect the policy, evidence, reasoning, audit linkage, and approval record supporting this finding.";

export type FindingEvidenceRouteOptions = {
  readonly architectureId?: string | null;
  readonly findingsQueueRunId?: string | null;
};

function normalizeFindingEvidenceRouteOptions(
  options?: string | null | FindingEvidenceRouteOptions,
): FindingEvidenceRouteOptions {
  if (typeof options === "string" || options === null || options === undefined) {
    return { findingsQueueRunId: options ?? undefined };
  }

  return options;
}

function appendPathSuffixBeforeQuery(href: string, suffix: string): string {
  const queryIndex = href.indexOf("?");

  if (queryIndex === -1) {
    return `${href}${suffix}`;
  }

  return `${href.slice(0, queryIndex)}${suffix}${href.slice(queryIndex)}`;
}

/** Finding detail page — parent surface of the evidence trace drill-down. */
export function getFindingDetailHref(
  runId: string,
  findingId: string,
  options?: string | null | FindingEvidenceRouteOptions,
): string {
  const normalized = normalizeFindingEvidenceRouteOptions(options);
  const architectureId = normalized.architectureId?.trim() ?? "";
  const queueRunId = (normalized.findingsQueueRunId ?? "").trim();
  const params = new URLSearchParams();

  if (queueRunId.length > 0) {
    params.set("runId", queueRunId);
  }

  if (architectureId.length > 0) {
    return buildReviewWorkspaceRouteHref({
      runId,
      architectureId,
      findingId,
      findingIdOnPath: true,
      search: params,
    });
  }

  const encRun = encodeURIComponent(runId.trim());
  const encFinding = encodeURIComponent(findingId.trim());
  const base = `/architecture/reviews/${encRun}/findings/${encFinding}`;

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
  options?: string | null | FindingEvidenceRouteOptions,
): string {
  const detailHref = getFindingDetailHref(runId, findingId, options);

  return appendPathSuffixBeforeQuery(detailHref, `/${FINDING_EVIDENCE_TRACE_SEGMENT}`);
}

/** In-page anchor for the disposition workflow on the evidence trace surface. */
export const FINDING_GOVERNANCE_DISPOSITION_HASH = "governance-disposition-heading";

/** Findings workspace deep link for recording disposition (review tab + finding selection + spine hash). */
export function resolveReviewFindingsWorkspaceDispositionHref(
  runId: string,
  findingId: string,
  architectureId?: string | null,
): string {
  return buildReviewDetailTabHref(runId.trim(), "findings", {
    findingId: findingId.trim(),
    hash: resolveFirstReviewSpineOpenGateSectionId("findings"),
    architectureId,
  });
}

/** Review findings tab deep link for Ask / insights citation follow-ups (findingId + spine hash). */
export function resolveReviewFindingsWorkspaceFindingHref(runId: string, findingId: string): string {
  return resolveReviewFindingsWorkspaceDispositionHref(runId, findingId);
}

/** Deep link to record disposition on the review findings workspace. */
export function getFindingGovernanceDispositionHref(
  runId: string,
  findingId: string,
  architectureId?: string | null,
): string {
  return resolveReviewFindingsWorkspaceDispositionHref(runId, findingId, architectureId);
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

/** Ask and insights citations land on the review findings workspace unless nested working findings applies. */
export function resolveQuickDecisionFindingWorkspaceHref(
  runId: string,
  findingId: string,
  options?: QuickDecisionFindingNavOptions,
): string {
  const architectureId = options?.architectureId?.trim() ?? "";

  if (options?.isWorkingMode === true && architectureId.length > 0) {
    return resolveQuickDecisionFindingInspectHref(runId, findingId, options);
  }

  return resolveReviewFindingsWorkspaceFindingHref(runId, findingId);
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
