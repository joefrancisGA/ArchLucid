/**
 * TB-2220 — Generalized mutate-in-workspace chip.
 * Irreversible admin/governance saves must name the active workspace beside the CTA,
 * not only in the top-bar scope switcher — a write against the wrong workspace is not
 * recoverable from the UI.
 */

import {
  readActiveWorkspaceScopeLabel,
  resolveWorkspaceScopeLabelFromRecord,
} from "@/lib/active-workspace-scope-label";
import type { OperatorScopeRecord } from "@/lib/operator/operator-scope-storage";

/** Prefix shown before the short workspace name on mutate CTAs. */
export const MUTATING_IN_WORKSPACE_CHIP_PREFIX = "Applies to workspace" as const;

export type MutatingInWorkspaceChipCopy = {
  readonly prefix: typeof MUTATING_IN_WORKSPACE_CHIP_PREFIX;
  readonly workspaceScopeLabel: string;
  /** Full accessible label: "{prefix}: {workspaceScopeLabel}". */
  readonly label: string;
};

export function formatMutatingInWorkspaceChipLabel(
  workspaceScopeLabel: string,
  prefix: string = MUTATING_IN_WORKSPACE_CHIP_PREFIX,
): string {
  const trimmedLabel = workspaceScopeLabel.trim();
  const trimmedPrefix = prefix.trim();

  if (trimmedLabel.length === 0) {
    return trimmedPrefix;
  }

  if (trimmedPrefix.length === 0) {
    return trimmedLabel;
  }

  return `${trimmedPrefix}: ${trimmedLabel}`;
}

export function buildMutatingInWorkspaceChipCopy(
  workspaceScopeLabel: string,
): MutatingInWorkspaceChipCopy {
  const label = formatMutatingInWorkspaceChipLabel(workspaceScopeLabel);

  return {
    prefix: MUTATING_IN_WORKSPACE_CHIP_PREFIX,
    workspaceScopeLabel,
    label,
  };
}

/** Resolve chip copy from an operator scope record (SSR-safe with null). */
export function resolveMutatingInWorkspaceChipFromRecord(
  record: OperatorScopeRecord | null,
): MutatingInWorkspaceChipCopy {
  return buildMutatingInWorkspaceChipCopy(resolveWorkspaceScopeLabelFromRecord(record));
}

/** Browser-side reader; uses the same precedence as the top-bar scope switcher. */
export function readMutatingInWorkspaceChipCopy(): MutatingInWorkspaceChipCopy {
  return buildMutatingInWorkspaceChipCopy(readActiveWorkspaceScopeLabel());
}
