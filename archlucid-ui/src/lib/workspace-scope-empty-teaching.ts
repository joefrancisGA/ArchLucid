/**
 * TB-2195 — honest empty-list teaching when the workspace/project switcher scopes the hub
 * to a specific selection. Does not claim the tenant has work elsewhere; only that this
 * selection is empty and the switcher can show other scopes.
 */

import {
  defaultLabelsForScopeIds,
  isDevDefaultScopeRecord,
  type OperatorScopeRecord,
} from "@/lib/operator/operator-scope-storage";

export type WorkspaceScopeEmptyTeachingCopy = {
  readonly title: string;
  readonly body: string;
  readonly ctaLabel: string;
};

export type BuildWorkspaceScopeEmptyTeachingArgs = {
  readonly scopeLabel: string;
  readonly objectPlural: string;
  readonly switcherHint: string;
};

/** Default CTA for opening the top-bar workspace/project switcher. */
export const WORKSPACE_SCOPE_EMPTY_TEACHING_CTA_LABEL = "Switch workspace/project" as const;

/**
 * Default body when callers do not customize `switcherHint`.
 * Honest: empty for this selection — other scopes may differ.
 */
export const WORKSPACE_SCOPE_EMPTY_TEACHING_DEFAULT_SWITCHER_HINT =
  "Switch workspace/project to see other work." as const;

/**
 * Builds title/body/cta for a hub list that is empty under the active switcher selection.
 */
export function buildWorkspaceScopeEmptyTeaching(
  args: BuildWorkspaceScopeEmptyTeachingArgs,
): WorkspaceScopeEmptyTeachingCopy {
  const scopeLabel = normalizeScopeLabel(args.scopeLabel);
  const objectPlural = normalizeObjectPlural(args.objectPlural);
  const switcherHint = normalizeSwitcherHint(args.switcherHint);

  return {
    title: `No ${objectPlural} in ${scopeLabel}`,
    body: switcherHint,
    ctaLabel: WORKSPACE_SCOPE_EMPTY_TEACHING_CTA_LABEL,
  };
}

/**
 * True when the list is empty and the operator switcher has a specific (non-dev-default)
 * workspace/project selection. We cannot prove the tenant has rows elsewhere — copy stays
 * scoped to "empty in this selection."
 */
export function shouldShowWorkspaceScopeEmptyTeaching(args: {
  readonly listEmpty: boolean;
  readonly scopeRecord: OperatorScopeRecord | null;
}): boolean {
  if (!args.listEmpty) {
    return false;
  }

  if (args.scopeRecord === null) {
    return false;
  }

  if (args.scopeRecord.projectId.trim().length === 0) {
    return false;
  }

  return !isDevDefaultScopeRecord(args.scopeRecord);
}

/** Prefer project label, then neutral id-derived project label. */
export function resolveWorkspaceScopeEmptyTeachingScopeLabel(
  record: OperatorScopeRecord | null,
): string {
  if (record === null) {
    return "this project";
  }

  if (record.projectLabel.trim().length > 0) {
    return record.projectLabel.trim();
  }

  return defaultLabelsForScopeIds(record.workspaceId, record.projectId).project;
}

export function buildReviewsHubWorkspaceScopeEmptyTeaching(
  record: OperatorScopeRecord | null,
): WorkspaceScopeEmptyTeachingCopy {
  return buildHubWorkspaceScopeEmptyTeaching(record, "reviews");
}

export function buildArchitecturesHubWorkspaceScopeEmptyTeaching(
  record: OperatorScopeRecord | null,
): WorkspaceScopeEmptyTeachingCopy {
  return buildHubWorkspaceScopeEmptyTeaching(record, "architecture drafts");
}

export function buildSignedRecordsHubWorkspaceScopeEmptyTeaching(
  record: OperatorScopeRecord | null,
): WorkspaceScopeEmptyTeachingCopy {
  return buildHubWorkspaceScopeEmptyTeaching(record, "sealed review records");
}

export function buildGovernanceFindingsHubWorkspaceScopeEmptyTeaching(
  record: OperatorScopeRecord | null,
): WorkspaceScopeEmptyTeachingCopy {
  return buildHubWorkspaceScopeEmptyTeaching(record, "findings");
}

export function buildAlertsInboxWorkspaceScopeEmptyTeaching(
  record: OperatorScopeRecord | null,
): WorkspaceScopeEmptyTeachingCopy {
  return buildHubWorkspaceScopeEmptyTeaching(record, "alerts");
}

/**
 * Returns scope-empty teaching copy when the hub list is empty under a non-default project
 * selection; otherwise null so the hub keeps its true-zero empty preset.
 */
export function resolveWorkspaceScopeEmptyTeachingForHub(args: {
  readonly listEmpty: boolean;
  readonly scopeRecord: OperatorScopeRecord | null;
  readonly objectPlural: string;
}): WorkspaceScopeEmptyTeachingCopy | null {
  if (!shouldShowWorkspaceScopeEmptyTeaching({ listEmpty: args.listEmpty, scopeRecord: args.scopeRecord })) {
    return null;
  }

  return buildWorkspaceScopeEmptyTeaching({
    scopeLabel: resolveWorkspaceScopeEmptyTeachingScopeLabel(args.scopeRecord),
    objectPlural: args.objectPlural,
    switcherHint: WORKSPACE_SCOPE_EMPTY_TEACHING_DEFAULT_SWITCHER_HINT,
  });
}

function buildHubWorkspaceScopeEmptyTeaching(
  record: OperatorScopeRecord | null,
  objectPlural: string,
): WorkspaceScopeEmptyTeachingCopy {
  return buildWorkspaceScopeEmptyTeaching({
    scopeLabel: resolveWorkspaceScopeEmptyTeachingScopeLabel(record),
    objectPlural,
    switcherHint: WORKSPACE_SCOPE_EMPTY_TEACHING_DEFAULT_SWITCHER_HINT,
  });
}

function normalizeScopeLabel(value: string): string {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : "this project";
}

function normalizeObjectPlural(value: string): string {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : "items";
}

function normalizeSwitcherHint(value: string): string {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : WORKSPACE_SCOPE_EMPTY_TEACHING_DEFAULT_SWITCHER_HINT;
}
