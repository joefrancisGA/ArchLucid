import type { KeyboardEvent } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { getFindingEvidenceTraceHref } from "@/lib/findings/finding-evidence-navigation";
import { graphTrailHrefWithOptionalNode } from "@/lib/graph-finding-deep-links";
import { preferredGraphNodeIdForFindingDeepLink } from "@/lib/findings/finding-inspect-graph-evidence";

import { reviewDetailPath } from "@/lib/architecture/architecture-routes";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

export function governanceFindingInspectHref(runId: string, findingId: string): string {
  return getFindingEvidenceTraceHref(runId, findingId);
}

export function governanceFindingManifestRecordHref(runId: string, manifestId: string): string {
  if (manifestId !== " — ") {
    return signedRecordDetailPath(manifestId);
  }

  return reviewDetailPath(runId);
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
): void {
  router.push(governanceFindingInspectHref(runId, findingId));
}

export function governanceFindingDetailKeyboardActivate(
  event: KeyboardEvent,
  router: AppRouterInstance,
  runId: string,
  findingId: string,
): void {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  navigateGovernanceFindingDetail(router, runId, findingId);
}
