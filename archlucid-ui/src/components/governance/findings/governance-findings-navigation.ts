import type { KeyboardEvent } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { architectureNestedFindingsPath } from "@/lib/architecture/architecture-routes";
import {
  getFindingDetailHref,
  getFindingEvidenceTraceHref,
} from "@/lib/findings/finding-evidence-navigation";
import { graphTrailHrefWithOptionalNode } from "@/lib/graph-finding-deep-links";
import { preferredGraphNodeIdForFindingDeepLink } from "@/lib/findings/finding-inspect-graph-evidence";

import { resolveWorkingRunReviewLocator } from "@/lib/architecture/resolve-working-run-review-locator";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

export type GovernanceFindingInspectHrefOptions = {
  readonly architectureId?: string | null;
  readonly isWorkingMode?: boolean;
  readonly findingsQueueRunId?: string | null;
};

/** IR-004 — Working inspect stays architecture-id-known via nested findings focusedFinding. */
export function governanceFindingInspectHref(
  runId: string,
  findingId: string,
  options?: GovernanceFindingInspectHrefOptions,
): string {
  const architectureId = options?.architectureId?.trim() ?? "";
  const isWorkingMode = options?.isWorkingMode === true;

  if (isWorkingMode && architectureId.length > 0) {
    const params = new URLSearchParams();
    params.set("runId", runId.trim());
    params.set("focusedFinding", findingId.trim());

    return `${architectureNestedFindingsPath(architectureId)}?${params.toString()}`;
  }

  return getFindingEvidenceTraceHref(runId, findingId, options?.findingsQueueRunId);
}

export type GovernanceQueueAuxiliaryFindingHrefInput = {
  readonly inspectHrefOptions?: GovernanceFindingInspectHrefOptions;
  readonly findingsQueueRunId?: string | null;
  /** Peer assigned-to-me strips use evidence-trace inspect; continue-last/triage use finding detail. */
  readonly usePeerInspectRoute?: boolean;
};

/** WA-001 — queue auxiliary strips stay on nested focusedFinding when architecture is known. */
export function resolveGovernanceQueueAuxiliaryFindingHref(
  runId: string,
  findingId: string,
  input?: GovernanceQueueAuxiliaryFindingHrefInput,
): string {
  const inspectHrefOptions = input?.inspectHrefOptions;
  const architectureId = inspectHrefOptions?.architectureId?.trim() ?? "";
  const isWorkingMode = inspectHrefOptions?.isWorkingMode === true;

  if (isWorkingMode && architectureId.length > 0) {
    return governanceFindingInspectHref(runId, findingId, inspectHrefOptions);
  }

  if (input?.usePeerInspectRoute === true) {
    return governanceFindingInspectHref(runId, findingId, {
      findingsQueueRunId: input.findingsQueueRunId,
    });
  }

  return getFindingDetailHref(runId, findingId, input?.findingsQueueRunId);
}

export function governanceFindingManifestRecordHref(runId: string, manifestId: string): string {
  if (manifestId !== " — ") {
    return signedRecordDetailPath(manifestId);
  }

  return resolveWorkingRunReviewLocator({ runId }).href;
}

export function governanceQueueGraphEvidenceHref(row: GovernanceFindingQueueRow): string | null {
  if (row.recordKind !== "finding") {
    return null;
  }

  const focused = preferredGraphNodeIdForFindingDeepLink(row.runId, row.findingId);

  if (focused !== null) {
    return graphTrailHrefWithOptionalNode(row.runId, focused);
  }

  const level = row.traceConfidenceLevel;

  if (level === "High" || level === "Medium" || level === "Low") {
    return graphTrailHrefWithOptionalNode(row.runId, null);
  }

  return null;
}

export function navigateGovernanceFindingDetail(
  router: AppRouterInstance,
  runId: string,
  findingId: string,
  options?: GovernanceFindingInspectHrefOptions,
): void {
  router.push(governanceFindingInspectHref(runId, findingId, options));
}

export function governanceFindingDetailKeyboardActivate(
  event: KeyboardEvent,
  router: AppRouterInstance,
  runId: string,
  findingId: string,
  options?: GovernanceFindingInspectHrefOptions,
): void {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  navigateGovernanceFindingDetail(router, runId, findingId, options);
}
