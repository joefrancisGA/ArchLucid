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
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";
import { resolveFirstReviewSpineOpenGateSectionId } from "@/lib/reviews/first-review-spine-band";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { governanceFindingQueueRowReviewHref } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { FINDING_CLASSIFICATION_DECISION_GRADE } from "@/lib/findings/review-detail-findings-classification-band";

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

/** Findings workspace deep link for queue disposition work (findingId + first-review spine hash). */
export function governanceFindingQueueFindingsWorkspaceHref(runId: string, findingId: string): string {
  return buildReviewDetailTabHref(runId.trim(), "findings", {
    findingId: findingId.trim(),
    hash: resolveFirstReviewSpineOpenGateSectionId("findings"),
  });
}

export function governanceFindingQueueRowNeedsDispositionRecording(row: GovernanceFindingQueueRow): boolean {
  if (row.recordKind !== "finding") {
    return false;
  }

  if (row.classification !== FINDING_CLASSIFICATION_DECISION_GRADE) {
    return false;
  }

  const disposition = row.latestDisposition?.trim() ?? "";

  return disposition.length === 0;
}

/** Queue title/inspect target: findings workspace when disposition is still open on decision-grade rows. */
export function governanceFindingQueuePrimaryInspectHref(
  row: GovernanceFindingQueueRow,
  options?: GovernanceFindingInspectHrefOptions,
): string | null {
  if (!row.runId.trim() || !row.findingId.trim()) {
    return null;
  }

  if (governanceFindingQueueRowNeedsDispositionRecording(row)) {
    return governanceFindingQueueFindingsWorkspaceHref(row.runId, row.findingId);
  }

  return governanceFindingInspectHref(row.runId, row.findingId, options);
}

/** Title link for queue rows — primary inspect when disposition is open, else evidence-trace inspect. */
export function governanceFindingQueueRowTitleInspectHref(
  row: GovernanceFindingQueueRow,
  options?: GovernanceFindingInspectHrefOptions,
): string {
  if (row.recordKind === "finding") {
    const primary = governanceFindingQueuePrimaryInspectHref(row, options);

    if (primary !== null) {
      return primary;
    }
  }

  return governanceFindingInspectHref(row.runId, row.findingId, options);
}

/** Review column link: findings workspace when this row still needs disposition recording. */
export function governanceFindingQueueRowReviewHrefForRow(row: GovernanceFindingQueueRow): string {
  if (governanceFindingQueueRowNeedsDispositionRecording(row)) {
    return governanceFindingQueueFindingsWorkspaceHref(row.runId, row.findingId);
  }

  return governanceFindingQueueRowReviewHref(row.runId);
}

export function governanceFindingManifestRecordHref(runId: string, manifestId: string): string {
  const normalizedManifestId = manifestId.trim();

  if (normalizedManifestId.length > 0 && normalizedManifestId !== "—") {
    return signedRecordDetailPath(normalizedManifestId);
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
  row: GovernanceFindingQueueRow,
  options?: GovernanceFindingInspectHrefOptions,
): void;
export function navigateGovernanceFindingDetail(
  router: AppRouterInstance,
  runId: string,
  findingId: string,
  options?: GovernanceFindingInspectHrefOptions,
): void;
export function navigateGovernanceFindingDetail(
  router: AppRouterInstance,
  runIdOrRow: string | GovernanceFindingQueueRow,
  findingIdOrOptions?: string | GovernanceFindingInspectHrefOptions,
  options?: GovernanceFindingInspectHrefOptions,
): void {
  if (typeof runIdOrRow !== "string") {
    const href = governanceFindingQueuePrimaryInspectHref(runIdOrRow, findingIdOrOptions as GovernanceFindingInspectHrefOptions | undefined);

    if (href === null) {
      return;
    }

    router.push(href);

    return;
  }

  const runId = runIdOrRow;
  const findingId = findingIdOrOptions as string;

  router.push(governanceFindingInspectHref(runId, findingId, options));
}

export function governanceFindingDetailKeyboardActivate(
  event: KeyboardEvent,
  router: AppRouterInstance,
  row: GovernanceFindingQueueRow,
  options?: GovernanceFindingInspectHrefOptions,
): void;
export function governanceFindingDetailKeyboardActivate(
  event: KeyboardEvent,
  router: AppRouterInstance,
  runId: string,
  findingId: string,
  options?: GovernanceFindingInspectHrefOptions,
): void;
export function governanceFindingDetailKeyboardActivate(
  event: KeyboardEvent,
  router: AppRouterInstance,
  runIdOrRow: string | GovernanceFindingQueueRow,
  findingIdOrOptions?: string | GovernanceFindingInspectHrefOptions,
  options?: GovernanceFindingInspectHrefOptions,
): void {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();

  if (typeof runIdOrRow !== "string") {
    navigateGovernanceFindingDetail(router, runIdOrRow, findingIdOrOptions as GovernanceFindingInspectHrefOptions | undefined);

    return;
  }

  navigateGovernanceFindingDetail(
    router,
    runIdOrRow,
    findingIdOrOptions as string,
    options,
  );
}
