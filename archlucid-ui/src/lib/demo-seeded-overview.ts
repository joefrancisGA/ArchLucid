/**
 * Demo/seeded Overview helpers (TB-1039) — detect pinned Workspace A/B, Claims Intake Demo
 * labels, and local DEV Claims Intake scope so empty Overview surfaces a sample package
 * instead of a blank customer-tenant shell.
 */

import {
  BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL,
  BUYER_SCOPE_SAMPLE_WORKSPACE_FULL_NAME,
  BUYER_SCOPE_SAMPLE_WORKSPACE_LABEL,
  OPERATOR_HOME_OPEN_SAMPLE_PACKAGE_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import {
  DEMO_WORKSPACE_A_RUN_ID,
  DEMO_WORKSPACE_B_RUN_ID,
  resolveDemoWorkspaceScopeHeadersForRunId,
} from "@/lib/demo-workspace-scope";
import {
  DEV_SCOPE_PROJECT_ID,
  DEV_SCOPE_TENANT_ID,
  DEV_SCOPE_WORKSPACE_ID,
} from "@/lib/scope";
import {
  SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
  SHOWCASE_STATIC_DEMO_SPINE_COUNTS,
} from "@/lib/showcase-static-demo";
import {
  SHOWCASE_SAMPLE_REVIEW_REGISTRY,
  showcaseSampleReviewPackageHref,
} from "@/lib/showcase-sample-review-registry";
import type { RunSummary } from "@/types/authority";

function normalizeGuid(value: string): string {
  return value.trim().replace(/-/g, "").toLowerCase();
}

function pinnedDemoScopeHeaders(): Array<Record<string, string>> {
  const workspaceA = resolveDemoWorkspaceScopeHeadersForRunId(DEMO_WORKSPACE_A_RUN_ID);
  const workspaceB = resolveDemoWorkspaceScopeHeadersForRunId(DEMO_WORKSPACE_B_RUN_ID);

  return [workspaceA, workspaceB].filter(
    (headers): headers is Record<string, string> => headers !== null,
  );
}

const PINNED_DEMO_PROJECT_IDS = new Set(
  pinnedDemoScopeHeaders().map((headers) => normalizeGuid(headers["x-project-id"] ?? "")),
);

const PINNED_DEMO_WORKSPACE_IDS = new Set(
  pinnedDemoScopeHeaders().map((headers) => normalizeGuid(headers["x-workspace-id"] ?? "")),
);

export function isPinnedDemoProjectId(projectId: string | null | undefined): boolean {
  if (projectId === null || projectId === undefined) {
    return false;
  }

  const trimmed = projectId.trim();

  if (trimmed.length === 0) {
    return false;
  }

  return PINNED_DEMO_PROJECT_IDS.has(normalizeGuid(trimmed));
}

export function isPinnedDemoWorkspaceId(workspaceId: string | null | undefined): boolean {
  if (workspaceId === null || workspaceId === undefined) {
    return false;
  }

  const trimmed = workspaceId.trim();

  if (trimmed.length === 0) {
    return false;
  }

  return PINNED_DEMO_WORKSPACE_IDS.has(normalizeGuid(trimmed));
}

/** Buyer labels that mean this Overview is a demo/seeded Claims Intake workspace. */
export function isDemoSeededOverviewWorkspaceLabel(label: string | null | undefined): boolean {
  if (label === null || label === undefined) {
    return false;
  }

  const normalized = label.trim().toLowerCase();

  if (normalized.length === 0) {
    return false;
  }

  return (
    normalized === BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL.toLowerCase() ||
    normalized === BUYER_SCOPE_SAMPLE_WORKSPACE_FULL_NAME.toLowerCase() ||
    normalized === BUYER_SCOPE_SAMPLE_WORKSPACE_LABEL.toLowerCase() ||
    normalized === SHOWCASE_SAMPLE_REVIEW_REGISTRY.workspaceLabel.toLowerCase()
  );
}

/** True for pinned Workspace A/B scope ids or local DEV Claims Intake defaults. */
export function isDemoSeededOverviewScope(
  scopeHeaders: Record<string, string> | null | undefined,
): boolean {
  if (scopeHeaders === null || scopeHeaders === undefined) {
    return false;
  }

  const tenantId = scopeHeaders["x-tenant-id"]?.trim() ?? "";
  const workspaceId = scopeHeaders["x-workspace-id"]?.trim() ?? "";
  const projectId = scopeHeaders["x-project-id"]?.trim() ?? "";

  if (isPinnedDemoProjectId(projectId) || isPinnedDemoWorkspaceId(workspaceId)) {
    return true;
  }

  if (tenantId.length === 0 || workspaceId.length === 0 || projectId.length === 0) {
    return false;
  }

  return (
    normalizeGuid(tenantId) === normalizeGuid(DEV_SCOPE_TENANT_ID) &&
    normalizeGuid(workspaceId) === normalizeGuid(DEV_SCOPE_WORKSPACE_ID) &&
    normalizeGuid(projectId) === normalizeGuid(DEV_SCOPE_PROJECT_ID)
  );
}

/**
 * Workspace A/B pins list under their fixture project GUID; other demo-seeded scopes keep the
 * caller fallback (usually `default`).
 */
export function resolveOverviewListProjectId(
  scopeHeaders: Record<string, string> | null | undefined,
  fallbackProjectId: string,
): string {
  const projectId = scopeHeaders?.["x-project-id"]?.trim() ?? "";

  if (isPinnedDemoProjectId(projectId)) {
    return projectId;
  }

  return fallbackProjectId;
}

export type DemoSeededOverviewSamplePackage = {
  readonly runId: string;
  readonly href: string;
  readonly label: string;
};

function resolvePinnedDemoRunId(
  scopeHeaders: Record<string, string> | null | undefined,
): string | null {
  if (scopeHeaders === null || scopeHeaders === undefined) {
    return null;
  }

  const projectId = scopeHeaders["x-project-id"]?.trim() ?? "";
  const workspaceId = scopeHeaders["x-workspace-id"]?.trim() ?? "";

  for (const runId of [DEMO_WORKSPACE_A_RUN_ID, DEMO_WORKSPACE_B_RUN_ID]) {
    const pinned = resolveDemoWorkspaceScopeHeadersForRunId(runId);

    if (pinned === null) {
      continue;
    }

    if (
      projectId.length > 0 &&
      normalizeGuid(projectId) === normalizeGuid(pinned["x-project-id"] ?? "")
    ) {
      return runId;
    }

    if (
      workspaceId.length > 0 &&
      normalizeGuid(workspaceId) === normalizeGuid(pinned["x-workspace-id"] ?? "")
    ) {
      return runId;
    }
  }

  return null;
}

/** Canonical sample package for the active demo/seeded scope (Workspace A/B or Claims showcase). */
export function resolveDemoSeededOverviewSamplePackage(
  scopeHeaders: Record<string, string> | null | undefined,
): DemoSeededOverviewSamplePackage {
  const pinnedRunId = resolvePinnedDemoRunId(scopeHeaders);
  const runId = pinnedRunId ?? SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId;

  return {
    runId,
    href: showcaseSampleReviewPackageHref(runId),
    label: OPERATOR_HOME_OPEN_SAMPLE_PACKAGE_CTA,
  };
}

/** Inject a Recent-reviews sample row only when the Overview list is empty on demo/seeded scope. */
export function shouldInjectDemoSeededOverviewSample(input: {
  readonly itemCount: number;
  readonly scopeHeaders: Record<string, string> | null | undefined;
  readonly workspaceLabel?: string | null;
  readonly staticDemoFallbackEnabled?: boolean;
}): boolean {
  if (input.itemCount !== 0) {
    return false;
  }

  if (input.staticDemoFallbackEnabled === true) {
    return true;
  }

  if (isDemoSeededOverviewWorkspaceLabel(input.workspaceLabel ?? null)) {
    return true;
  }

  return isDemoSeededOverviewScope(input.scopeHeaders);
}

/** True for synthetic Overview rows injected by {@link buildDemoSeededOverviewRunSummary}. */
export function isDemoSeededOverviewInjectedRun(
  run: Pick<RunSummary, "demoSeededOverviewInject">,
): boolean {
  return run.demoSeededOverviewInject === true;
}

/** One completed sample row for Overview Recent reviews on demo/seeded empty lists. */
export function buildDemoSeededOverviewRunSummary(
  projectId: string,
  scopeHeaders: Record<string, string> | null | undefined,
): RunSummary {
  const sample = resolveDemoSeededOverviewSamplePackage(scopeHeaders);
  const trimmedProjectId = projectId.trim();
  const listProjectId =
    trimmedProjectId.length > 0 && trimmedProjectId !== "default"
      ? trimmedProjectId
      : resolveOverviewListProjectId(scopeHeaders, trimmedProjectId.length > 0 ? trimmedProjectId : "default");

  return {
    runId: sample.runId,
    projectId: listProjectId,
    description: SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
    createdUtc: "2026-01-15T12:00:00.000Z",
    hasContextSnapshot: true,
    hasGraphSnapshot: true,
    hasFindingsSnapshot: true,
    hasGoldenManifest: true,
    // Matches showcase proof copy: finalized with monitored residual risk.
    hasGovernanceWarnings: true,
    findingCount: SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount,
    warningCount: SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount,
    packageOrigin: "Reviewed",
    // Marks synthetic inject so empty-home still shows Do-this-next (not real tenant activity).
    demoSeededOverviewInject: true,
  };
}
